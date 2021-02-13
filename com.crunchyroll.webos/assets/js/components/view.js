V.component('[data-view]', {

    /**
     * Attach router component changes
     * @return {void}
     */
    onMount: function(){

        var self = this;
        var element = self.element;

        var isLoggedIn = function(){
            var expires = Store.get('expires', false);
            return expires && new Date() < new Date(expires);
        }

        V.route.beforeChange(function(){

            // Kind of 404
            if( !this.next ){
                this.next = V.route.match('/queue');
            }

            // Check login
            if( !isLoggedIn() ){
                this.next = V.route.match('/login');
            }

        });

        V.route.afterChange(async function(){

            var previous = this.previous;
            var next = this.next;
            var body = document.body;

            if( previous && previous.id ){
                body.classList.remove('page-' + previous.id)
            }

            // Destroy previous route
            if( previous && previous.component ){
                await V.destroy(element);
            }

            // Route unauthenticated only
            if( next && next.unauthenticated ){
                if( isLoggedIn() ){
                    return V.route.redirect('/queue');
                }
            }

            // Route authenticated only
            if( next && next.authenticated ){
                if( !isLoggedIn() ){
                    return V.route.redirect('/login');
                }
            }

            if( next && next.id ){
                body.classList.add('page-' + next.id);
            }

            if( next && next.component ){
                element.innerHTML = next.component;
                await V.mount(element);
            }

        });

    },

    /**
     * Trigger initial popstate event
     * @return {void}
     */
    afterRender: function(){
        V.trigger(window, 'popstate');
    }

});