import type { Callback, State, Template } from "./vine"
import { fire, register, Route, unwatch, watch } from "./vine"
import { Api } from "./api"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        loaded: false,
        error: false,
        message: '',
        items: []
    }
}

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('queue', state)
}

/**
 * List queue
 * @param component
 */
const listQueue: Callback = async (component) => {

    const fields = [
        'image.full_url',
        'image.fwide_url',
        'image.fwidestar_url',
        'image.height',
        'image.large_url',
        'image.medium_url',
        'image.small_url',
        'image.thumb_url',
        'image.wide_url',
        'image.widestar_url',
        'image.width',
        'media.availability_notes',
        'media.available',
        'media.available_time',
        'media.bif_url',
        'media.class',
        'media.clip',
        'media.collection_id',
        'media.collection_name',
        'media.created',
        'media.description',
        'media.duration',
        'media.episode_number',
        'media.free_available',
        'media.free_available_time',
        'media.free_unavailable_time',
        'media.media_id',
        'media.media_type',
        'media.name',
        'media.playhead',
        'media.premium_available',
        'media.premium_available_time',
        'media.premium_only',
        'media.premium_unavailable_time',
        'media.screenshot_image',
        'media.series_id',
        'media.series_name',
        'media.stream_data',
        'media.unavailable_time',
        'media.url',
        'last_watched_media',
        'last_watched_media_playhead',
        'most_likely_media',
        'most_likely_media_playhead',
        'ordering',
        'playhead',
        'queue_entry_id',
        'series',
        'series.class',
        'series.collection_count',
        'series.description',
        'series.genres',
        'series.in_queue',
        'series.landscape_image',
        'series.media_count',
        'series.media_type',
        'series.name',
        'series.portrait_image',
        'series.publisher_name',
        'series.rating',
        'series.series_id',
        'series.url',
        'series.year'
    ]

    fire('loading::show')

    try {

        const response = await Api.request('POST', '/queue', {
            media_types: 'anime',
            fields: fields.join(',')
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listQueue(component)
        }

        const data = response.data || []
        const items = data.map((item: object) => {
            return Api.toSerieEpisode(item, 'queue')
        }).filter(Boolean)

        await component.render({
            loaded: true,
            items: items,
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
const onMount: Callback = (component) => {

    watch(component.element, 'view::reload', () => {
        listQueue(component)
    })

    listQueue(component)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({element}) => {
    unwatch(element, 'view::reload')
}

register('[data-queue]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'queue',
    menuId: 'queue',
    path: '/queue',
    title: 'Queue',
    component: '<div data-queue></div>',
    authenticated: true
})
Route.add({
    id: 'queue',
    menuId: 'queue',
    path: '/home',
    title: 'Queue',
    component: '<div data-queue></div>',
    authenticated: true
})
Route.add({
    id: 'queue',
    menuId: 'queue',
    path: '/',
    title: 'Queue',
    component: '<div data-queue></div>',
    authenticated: true
})
