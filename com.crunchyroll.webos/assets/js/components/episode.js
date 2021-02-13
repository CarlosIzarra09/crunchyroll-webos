V.component('[data-episode]', {

    /**
     * On mount
     * @return {void}
     */
    onMount: function(){

        var self = this;
        var element = self.element;

        var duration = element.dataset.episodeDuration;
        var playhead = element.dataset.episodePlayhead;
        var premium = element.dataset.episodePremium;
        var progress = (100 / Number(duration)) * Number(playhead);

        if( progress ){
            var progressElement = V.$('.list-item-progress', element);
                progressElement.style.width = progress + '%';
                progressElement.classList.remove('hidden');
        }

        if( premium == 1 ){
            var premiumElement = V.$('.list-item-premium', element);
                premiumElement.classList.remove('hidden');
        }

    }

});