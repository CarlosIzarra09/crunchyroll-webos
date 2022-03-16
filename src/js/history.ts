V.route.add({
    id: 'history',
    path: '/history',
    title: 'History',
    component: '<div data-history></div>',
    authenticated: true
});
V.route.add({
    id: 'history',
    path: '/history/:pageNumber',
    title: 'History',
    component: '<div data-history></div>',
    authenticated: true
});

V.component('[data-history]', {

    /**
     * Return template data
     * @returns
     */
    template: async function () {
        return await Api.getTemplate('/templates/history.html');
    },

    /**
     * On mount
     */
    onMount: async function () {

        var self = this;
        var pageNumber = V.route.active().param('pageNumber') || 1;

        self.set({
            pageNumber: pageNumber
        });

        self.watch('currentViewReload', function () {
            self.listHistory();
        });

        self.listHistory();

    },

    /**
     * List history
     */
    listHistory: async function () {

        var self = this;
        var pageNumber = Number(self.get('pageNumber'));
        var limit = 8;

        var fields = [
            'media',
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
            'playhead',
            'timestamp',
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
        ];

        Connector.showLoading();

        try {

            var response = await Api.request('POST', '/recently_watched', {
                fields: fields.join(','),
                limit: limit,
                offset: (pageNumber - 1) * limit
            });

            if (response.error
                && response.code == 'bad_session') {
                return Api.tryLogin().then(function () {
                    self.listHistory();
                });
            }

            var items = response.data.map(function (item: object) {
                return Api.toSerieEpisode(item, 'history');
            });

            await self.render({
                loaded: true,
                items: items
            });

            Connector.hideLoading();
            Connector.setActiveElement();

        } catch (error) {
            console.log(error);
        }

        Connector.hideLoading();

    }

});