V.route.add({
    id: 'video',
    path: '/serie/:serieId/episode/:episodeId/video',
    title: 'Episode Video',
    component: '<div data-video></div>',
    authenticated: true
});

V.component('[data-video]', {

    /**
     * HLS instance
     * @var {Hls}
     */
    hls: null,

    /**
     * Streams data
     * @var {Array}
     */
    streams: [],

    /**
     * Episodes
     * @var {Array}
     */
    episodes: [],

    /**
     * Return template data
     * @return {string}
     */
    template: function(){
        return V.$('#template-video').innerHTML;
    },

    /**
     * On mount
     * @return {void}
     */
    onMount: function(){

        var self = this;
        var element = this.element;
        var serieId = V.route.active().param('serieId');
        var controlsTimeout = null;

        // UI Events
        self.on('click', '.video-close', function(e){
            e.preventDefault();
            self.pauseVideo();
            self.hideVideo();
            V.route.redirect('/home');
        });

        self.on('click', '.video-watched', function(e){
            e.preventDefault();
            self.setWatched();
        });

        self.on('click', '.video-episodes', function(e){
            e.preventDefault();
            self.pauseVideo();
            self.hideVideo();
            V.route.redirect('/serie/' + serieId);
        });

        self.on('click', '.video-previous-episode', function(e){

            e.preventDefault();

            var previous = self.episodes[0];
            var serieId = previous.series_id;
            var episodeId = previous.media_id;
            var url = '/serie/' + serieId + '/episode/' + episodeId + '/video';

            V.route.redirect(url);

            self.pauseVideo();
            self.render();

        });

        self.on('click', '.video-next-episode', function(e){

            e.preventDefault();

            var next = self.episodes[2];
            var serieId = next.series_id;
            var episodeId = next.media_id;
            var url = '/serie/' + serieId + '/episode/' + episodeId + '/video';

            V.route.redirect(url);

            self.pauseVideo();
            self.render();

        });

        self.on('click', '.video-fullscreen', function(e){
            e.preventDefault();
            self.toggleFullScreen();
        });

        self.on('click', '.video-pause', function(e){
            e.preventDefault();
            self.pauseVideo();
        });

        self.on('click', '.video-play', function(e){
            e.preventDefault();
            self.playVideo();
        });

        self.on('click', '.video-reload', function(e){
            e.preventDefault();
            self.pauseVideo();
            self.render();
        });

        self.on('click', '.video-forward', function(e){
            e.preventDefault();
            self.forwardVideo(5);
        });

        self.on('click', '.video-backward', function(e){
            e.preventDefault();
            self.backwardVideo(5);
        });

        self.on('click', '.video-skip-intro', function(e){
            e.preventDefault();
            self.forwardVideo(80);
        });

        // Quality
        self.on('click', '.video-quality div', function(e){

            e.preventDefault();
            var level = Number(this.dataset.level);

            self.hls.nextLoadLevel = level;
            self.hls.autoLevelCapping = (level === -1) ? true : false;

        });

        // Mouse Events
        V.on(element, 'mouseenter mousemove', function(){

            element.classList.add('show-controls');

            if( controlsTimeout ){
                window.clearTimeout(controlsTimeout);
            }

            controlsTimeout = window.setTimeout(function(){
                element.classList.remove('show-controls');
            }, 2000); // 2s

        });

        V.on(element, 'mouseleave', function(){
            element.classList.remove('show-controls');
        });

        V.on(element, 'mousemove touchmove', 'input[type="range"]', function(e){
            self.updateSeekTooltip(e);
        });

        self.on('click input', 'input[type="range"]', function(e){
            self.skipAhead(e.target.dataset.seek);
        });

        // Public
        window.playVideo = function(){
            return self.playVideo();
        };
        window.pauseVideo = function(){
            return self.pauseVideo();
        };
        window.stopVideo = function(){
            return self.stopVideo();
        };
        window.toggleVideo = function(){
            return self.toggleVideo();
        }
        window.forwardVideo = function(seconds){
            return self.forwardVideo(seconds);
        }
        window.backwardVideo = function(seconds){
            return self.backwardVideo(seconds);
        }

    },

    /**
     * After render
     * @return {void}
     */
    afterRender: async function(){

        var self = this;
        var element = self.element;

        element.classList.remove('video-has-error');
        element.classList.remove('video-is-active');
        element.classList.remove('video-is-loading');
        element.classList.remove('video-is-loaded');
        element.classList.remove('video-is-playing');
        element.classList.remove('video-is-paused');

        window.setTimeout(async function(){

            var video = V.$('video', self.element);
                video.controls = false;

            self.video = video;
            self.playing = false;

            // Video Events
            V.on(video, 'click', function(e){
                e.preventDefault();
                self.toggleVideo();
            });

            V.on(video, 'timeupdate', function(){
                self.updateDuration();
                self.updateTimeElapsed();
                self.updateProgress();
            });

            window.showLoading();

            try {
                await self.loadVideo();
                await self.streamVideo();
                await self.showVideo();
                await self.playVideo();
            } catch (error) {
                self.showError(error.message);
            }

            window.hideLoading();

        });

    },

    /**
     * Format time
     * @param {Number} time
     * @return {Object}
     */
    formatTime: function(time){

        var result = new Date(time * 1000).toISOString().substr(11, 8);
        var minutes = result.substr(3, 2);
        var seconds = result.substr(6, 2);

        return {
            m: minutes,
            s: seconds
        }
    },

    /**
     * Show error message
     * @param {string} message
     */
    showError: function(message){

        var self = this;
        var element = self.element;
        var error = V.$('.video-error', element);

        element.classList.add('video-has-error');
        error.innerHTML = message;

    },

    /**
     * Show video
     * @return {void}
     */
    showVideo: function(){

        var self = this;
        var element = self.element;
        var playButton = V.$('.video-play', element);

        element.classList.add('video-is-active');
        window.setActiveElement(playButton);

    },

    /**
     * Hide video
     * @return {void}
     */
    hideVideo: function(){

        var self = this;
        var element = self.element;

        element.classList.remove('video-is-active');

        if( document.fullscreenElement ){
            document.exitFullscreen();
        }

    },

    /**
     * Load video
     * @return {Promise}
     */
    loadVideo: async function(){

        var self = this;
        var element = self.element;
        var video = self.video;
        var serie = V.$('.video-serie', element);
        var title = V.$('.video-title', element);
        var episodeId = V.route.active().param('episodeId');

        var fields = [
            'media.episode_number',
            'media.name',
            'media.stream_data',
            'media.media_id',
            'media.playhead',
            'media.duration',
            'media.series_id',
            'media.series_name'
        ];

        try {

            var response = await Api.request('POST', '/info', {
                media_id: episodeId,
                fields: fields.join(',')
            });

            if( response.error
                && response.code == 'bad_session' ){
                return Api.tryLogin().then(function(){
                    self.loadVideo();
                });
            }

            var episodeNumber = response.data.episode_number;
            var episodeName = response.data.name;
            var serieId = response.data.series_id;
            var serieName = response.data.series_name;

            serie.innerHTML = serieName + ' / Episode ' + episodeNumber;
            title.innerHTML = episodeName;

            var streams = response.data.stream_data.streams;
            var startTime = response.data.playhead || 0;
            var duration = response.data.duration || 0;

            if( startTime / duration > 0.90 || startTime < 30 ){
                startTime = 0;
            }

            self.streams = streams;
            video.currentTime = startTime;

            self.loadClosestEpisodes(serieId, episodeNumber);

        } catch (error) {
            self.showError(error.message);
        }

    },

    /**
     * Load next and previous episodes
     * @param {Number} serieId
     * @param {Number} episodeNumber
     * @return {void}
     */
    loadClosestEpisodes: async function(serieId, episodeNumber){

        var self = this;
        var fields = [
            'media',
            'media.name',
            'media.description',
            'media.episode_number',
            'media.duration',
            'media.playhead',
            'media.screenshot_image',
            'media.media_id',
            'media.series_id',
            'media.series_name',
            'media.collection_id',
            'media.url',
            'media.free_available'
        ];

        var response = await Api.request('POST', '/list_media', {
            series_id: serieId,
            sort: 'asc',
            fields: fields.join(','),
            limit: 3,
            offset: episodeNumber - 2
        });

        self.episodes = response.data;

    },

    /**
     * Stream video
     * @return {void}
     */
    streamVideo: async function(){

        var self = this;
        var element = self.element;
        var video = self.video;
        var streams = self.streams;

        if( !streams.length ){
            throw Error('No streams to load.');
        }

        var stream = streams[ streams.length - 1 ].url;
        var currentTime = video.currentTime || 0;

        var proxy = document.body.dataset.proxy;
        if( proxy ){
            stream = proxy + encodeURI(stream);
        }

        element.classList.add('video-is-loading');

        if( video.canPlayType('application/vnd.apple.mpegurl') ){

            element.classList.remove('video-is-loading');
            element.classList.add('video-is-loaded');

            video.src = stream;
            video.currentTime = currentTime;

            return;
        }

        return await new Promise(function (resolve){

            if( !Hls.isSupported() ) {
                throw Error('Video format not supported.');
            }

            var hls = new Hls({
                autoStartLoad: false,
                startLevel: -1, // auto
                maxBufferLength: 15, // 15s
                backBufferLength: 15, // 15s
                maxBufferSize: 30 * 1000 * 1000, // 30MB
                maxFragLookUpTolerance: 0.2,
                nudgeMaxRetry: 10
            });

            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                hls.loadSource(stream);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, function(){
                hls.startLoad(currentTime);
            });

            hls.on(Hls.Events.LEVEL_LOADED, function(){
                element.classList.remove('video-is-loading');
                element.classList.add('video-is-loaded');
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, function(){

                var level = hls.currentLevel;
                var next = V.$('.video-quality div[data-level="' + level + '"]');

                if( !next ){
                    next = V.$('.video-quality div[data-level="-1"]');
                }

                V.$('.video-quality div.active').classList.remove('active');
                next.classList.add('active');

            });

            hls.once(Hls.Events.FRAG_LOADED, function(){
                resolve();
            });

            hls.on(Hls.Events.ERROR, function(_event, data){

                if( !data.fatal ){
                    return;
                }

                switch (data.type) {
                    case Hls.ErrorTypes.OTHER_ERROR:
                        //hls.startLoad();
                    break;
                    case Hls.ErrorTypes.NETWORK_ERROR:

                        if( data.details == 'manifestLoadError' && data.response.code == 0 ){
                            self.showError('Episode cannot be played because of CORS error. You must use a proxy.');
                        }else{
                            hls.startLoad();
                        }

                    break;
                    case Hls.ErrorTypes.MEDIA_ERROR:

                        self.showError('Media error: trying recovery...');
                        hls.recoverMediaError();

                    break;
                    default:

                        self.showError('Media cannot be recovered: ' + data.details);
                        hls.destroy();

                    break;
                }

            });

            hls.attachMedia(video);
            self.hls = hls;

        });
    },

    /**
     * Play video
     * @return {void}
     */
    playVideo: async function(){

        var self = this;
        var element = self.element;
        var video = self.video;

        try{
            await video.play();
        } catch(err) {
        }

        element.classList.remove('video-is-paused');
        element.classList.add('video-is-playing');

        self.playing = true;
        self.trackProgress();

    },

    /**
     * Pause video
     * @return {void}
     */
    pauseVideo: function(){

        var self = this;
        var element = self.element;
        var video = self.video;

        video.pause();
        element.classList.remove('video-is-playing');
        element.classList.add('video-is-paused');

        self.playing = false;
        self.stopTrackProgress();

    },

    /**
     * Stop video
     * @return {void}
     */
    stopVideo: function(){

        var self = this;

        self.pauseVideo();
        self.skipAhead(0);

    },

    /**
     * Toggle video
     * @return {void}
     */
    toggleVideo: function(){

        var self = this;

        if( self.playing ){
            self.pauseVideo();
        } else {
            self.playVideo();
        }

    },

    /**
     * Forward video
     * @param {Number} seconds
     * @return {void}
     */
    forwardVideo: function(seconds){

        var self = this;
        var video = self.video;

        self.skipAhead(video.currentTime + seconds);

    },

    /**
     * Backward video
     * @param {Number} seconds
     * @return {void}
     */
    backwardVideo: function(seconds){

        var self = this;
        var video = self.video;

        self.skipAhead(video.currentTime - seconds);

    },

    /**
     * Skip ahead video
     * @param {Number} skipTo
     * @return {void}
     */
    skipAhead: function(skipTo){

        if( !skipTo ){
            return;
        }

        var self = this;
        var element = self.element;
        var video = self.video;
        var seek = V.$('input[type="range"]', element);
        var progress = V.$('progress', element);

        video.currentTime = skipTo;
        seek.value = skipTo;
        progress.value = skipTo;

    },

    /**
     * Toggle full screen mode
     * @return {void}
     */
    toggleFullScreen: function(){

        var self = this;
        var element = self.element;

        if( document.fullscreenElement ){
            document.exitFullscreen();
        } else {
            element.requestFullscreen().catch(function(){});
        }

    },

    /**
     * Update seek tooltip text and position
     * @param {Event} event
     * @return {void}
     */
    updateSeekTooltip: function(event){

        var self = this;
        var element = self.element;
        var tooltip = V.$('.tooltip', element);
        var seek = V.$('input[type="range"]', element);
        var bcr = event.target.getBoundingClientRect();
        var offsetX = event.offsetX;
        var pageX = event.pageX;

        if( window.TouchEvent && event instanceof TouchEvent ){
            offsetX = event.targetTouches[0].clientX - bcr.x;
            pageX = event.targetTouches[0].pageX;
        }

        var max = Number(seek.max);
        var skipTo = Math.round(
            (offsetX / event.target.clientWidth)
            * parseInt(event.target.getAttribute('max'), 10)
        );

        if( skipTo > max ){
            skipTo = max;
        }

        var format = self.formatTime(skipTo);

        seek.dataset.seek = skipTo;
        tooltip.textContent = format.m + ':' + format.s;
        tooltip.style.left = pageX + 'px';

    },

    /**
     * Update video duration
     * @return {void}
     */
    updateDuration: function(){

        var self = this;
        var element = self.element;
        var video = self.video;
        var duration = V.$('.duration', element);
        var seek = V.$('input[type="range"]', element);
        var progress = V.$('progress', element);

        var time = Math.round(video.duration);
        var format = self.formatTime(time);

        duration.innerText = format.m + ':' + format.s;
        duration.setAttribute('datetime', format.m + 'm ' + format.s + 's');

        seek.setAttribute('max', time);
        progress.setAttribute('max', time);

    },

    /**
     * Update video time elapsed
     * @return {void}
     */
    updateTimeElapsed: function(){

        var self = this;
        var element = self.element;
        var video = self.video;
        var elapsed = V.$('.elapsed', element);

        var time = Math.round(video.currentTime);
        var format = self.formatTime(time);

        elapsed.innerText = format.m + ':' + format.s;
        elapsed.setAttribute('datetime', format.m + 'm ' + format.s + 's');

    },

    /**
     * Update video progress
     * @return {void}
     */
    updateProgress: function(){

        var self = this;
        var element = self.element;
        var video = self.video;
        var seek = V.$('input[type="range"]', element);
        var progress = V.$('progress', element);

        seek.value = Math.floor(video.currentTime);
        progress.value = Math.floor(video.currentTime);

    },

    /**
     * Start progress tracking
     * @return {void}
     */
    trackProgress: function(){

        var self = this;

        if( self.trackTimeout ){
            self.stopTrackProgress();
        }

        self.trackTimeout = window.setTimeout(function(){
            self.updatePlaybackStatus();
        }, 30000); // 30s

    },

    /**
     * Stop progress tracking
     * @return {void}
     */
    stopTrackProgress: function(){

        var self = this;

        if( self.trackTimeout ){
            window.clearTimeout(self.trackTimeout);
        }

    },

    /**
     * Update playback status at Crunchyroll
     * @return {Promise}
     */
    updatePlaybackStatus: async function(){

        var self = this;
        var video = self.video;
        var episodeId = V.route.active().param('episodeId');

        var elapsed = 30;
        var elapsedDelta = 30;
        var playhead = video.currentTime;

        if( playhead != self.lastPlayhead ){
            await Api.request('POST', '/log', {
                event: 'playback_status',
                media_id: episodeId,
                playhead: playhead,
                elapsed: elapsed,
                elapsedDelta: elapsedDelta
            });
        }

        self.lastPlayhead = playhead;
        self.trackProgress();

    },

    /**
     * Set video as watched at Crunchyroll
     * @return {Promise}
     */
    setWatched: async function(){

        var self = this;
        var video = self.video;
        var episodeId = V.route.active().param('episodeId');

        var duration = Math.floor(video.duration);
        var playhead = Math.floor(video.currentTime);
        var elapsed = duration - playhead;
        var elapsedDelta = duration - playhead;

        await Api.request('POST', '/log', {
            event: 'playback_status',
            media_id: episodeId,
            playhead: duration,
            elapsed: elapsed,
            elapsedDelta: elapsedDelta
        });

        self.stopTrackProgress();

    }

});