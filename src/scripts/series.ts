import type { Callback, State, Template } from "./vine"
import { fire, on, off, register, Route, unwatch, watch } from "./vine"
import { Api } from "./api"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        pageNumber: 1,
        filter: 'popular',
        search: '',
        loaded: false,
        error: false,
        message: '',
        filters: [],
        items: [],
        nextPage: '',
        previousPage: ''
    }
}

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('series', state)
}

/**
 * Parse route params to the component
 * @param component
 */
const parseParams: Callback = (component) => {

    const pageNumber = Number(Route.getParam('pageNumber') || 1)
    const filter = String(Route.getParam('filter') || 'popular')
    const search = String(Route.getQuery('search') || '')

    component.state.pageNumber = pageNumber
    component.state.filter = filter
    component.state.search = search

}

/**
 * Retrieve series filter options
 * @param component
 */
const retrieveFilters: Callback = async (component) => {

    let filters = []
    let categories = []

    const local = localStorage.getItem('categories')
    if( local ){
        categories = categories.concat(
            JSON.parse(local) as Array<any>
        )
    }

    // Default filters
    filters.push({ id: '', name: '--- FILTERS' })
    filters.push({ id: 'alpha', name: 'Alphabetical' })
    filters.push({ id: 'featured', name: 'Featured' })
    filters.push({ id: 'newest', name: 'Newest' })
    filters.push({ id: 'popular', name: 'Popular' })
    filters.push({ id: 'updated', name: 'Updated' })
    filters.push({ id: 'simulcast', name: 'Simulcasts' })

    // Retrieve category filters
    if (!categories.length) {

        try {

            const response = await Api.request('POST', '/categories', {
                media_type: 'anime'
            })

            if (response.error
                && response.code == 'bad_session') {
                await Api.tryLogin()
                return retrieveFilters(component)
            }

            if (response.error && response.message) {
                throw new Error(response.message)
            }

            categories.push({ id: '-', name: '--- GENRES' })
            response.data.genre.map((item: { tag: any, label: any }) => {
                categories.push({ id: item.tag, name: item.label })
            })

            // categories.push({id: '-', name: '--- SEASONS'})
            // response.data.season.map((item) => {
            //     categories.push({id: item.tag, name: item.label})
            // })

            localStorage.setItem('categories', JSON.stringify(categories))

        } catch (error) {
            console.log(error)
        }

    }

    if (categories && categories.length) {
        categories.map((item) => {
            filters.push({ id: 'tag:' + item.id, name: item.name })
        })
    }

    component.state.filters = filters

}

/**
 * List series
 * @parma component
 */
const listSeries: Callback = async (component) => {

    const limit = 20
    const pageNumber = Number(component.state.pageNumber)
    const search = String(component.state.search)
    let filter = String(component.state.filter)

    if (search) {
        filter = 'prefix:' + search
    }

    // Fields option
    const fields = [
        'series.series_id',
        'series.name',
        'series.in_queue',
        'series.description',
        'series.portrait_image',
        'series.landscape_image',
        'series.media_count',
        'series.publisher_name',
        'series.year',
        'series.rating',
        'series.url',
        'series.media_type',
        'series.genres',
        'series.etp_guid',
        'image.wide_url',
        'image.fwide_url',
        'image.widestar_url',
        'image.fwidestar_url',
        'image.full_url'
    ]

    fire('loading::show')

    try {

        const response = await Api.request('POST', '/list_series', {
            media_type: 'anime',
            filter: filter,
            fields: fields.join(','),
            limit: limit,
            offset: (pageNumber - 1) * limit
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listSeries(component)
        }

        const data = response.data || []
        const items = data.map((item: object) => {
            return Api.toSerie(item)
        })

        const base = 'series/' + filter + '/'
        const nextPage = (items.length) ? base + (pageNumber + 1) : ''
        const previousPage = (pageNumber > 1) ? base + (pageNumber - 1) : ''

        await component.render({
            loaded: true,
            items: items,
            nextPage: nextPage,
            previousPage: previousPage,
            error: response.error,
            message: response.message || ''
        })

    } catch (error) {
        console.log(error)
    }

    fire('loading::hide')
    fire('active::element::set')

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = async (component) => {

    const element = component.element

    on(element, 'change', 'input#filter', (_event, target: HTMLInputElement) => {
        Route.redirect('/series/' + target.value)
    })

    on(element, 'change', 'input#search', (_event, target: HTMLInputElement) => {
        Route.redirect('/series?search=' + encodeURI(target.value))
    })

    watch(element, 'view::reload', async () => {
        await parseParams(component)
        await listSeries(component)
    })

    await parseParams(component)
    await retrieveFilters(component)
    await listSeries(component)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {

    off(element, 'change', 'input#filter')
    off(element, 'change', 'input#search')

    unwatch(element, 'view::reload')

}

register('[data-series]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'series',
    menuId: 'series',
    path: '/series',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    menuId: 'series',
    path: '/series/:filter',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    menuId: 'series',
    path: '/series/:filter/:pageNumber',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
