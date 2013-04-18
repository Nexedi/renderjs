var safejs;

define(
    [
        './jquery-wrapper',
        './policies',
        './sandbox'
    ], 
    function(jQuery, policy, sandbox) {
        
        /* 
         * Create a sandboxed environment for script according to a
         * spec literal object with the following attributes:
         * 
         * - policy: the desired policy
         * - node:   a selector matching a dom element
         * - script: the JS script path
         */

        function secure(spec) {

            /*
             * Based on web workers. The sandboxed env.  is isolated
             * through a separate process + web browser DOM isolation
             * in Web Workers.
             */
            
            return sandbox({
                policy:  policy(spec.policy),
                scripts: spec.scripts,
                node:    spec.node,
                dependencies: spec.dependencies || []
            });
        };

        function initialize() {
			jQuery('script[type="text/safe-javascript"]').each(function(index, element) {
                // Read the DOM node access from the metadata
                // If several nodes match, only take the first one
                var domElement = jQuery(jQuery(element).attr('node')).get(0);

                // TODO: read the policy from the DOM;
				secure({
                    policy: jQuery(element).attr('policy'), 
                    scripts: [jQuery(element).attr('src')],
                    node: domElement
                });
			});
        };

        /*
         * Sandbox scripts on initialization
         */

        jQuery(document).ready(function() {
            initialize();
		});       

        safejs = secure;
    }
)
