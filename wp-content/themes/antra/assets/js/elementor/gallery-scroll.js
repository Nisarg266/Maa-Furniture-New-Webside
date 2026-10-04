(function ($) {
    "use strict";
    $(window).on('elementor/frontend/init', () => {
        const addHandler = ($element) => {
            if ($.fn.fancybox) {
                $('.gallery-image-link', $element).fancybox({
                    loop: false,
                    clickOutside: "close",
                    thumbs: {
                        autoStart: true
                    }
                });
            }
        };
        if (window.elementorFrontend && window.elementorFrontend.hooks) {
            elementorFrontend.hooks.addAction('frontend/element_ready/antra-gallery-scroll.default', addHandler);
        }
    });

    $(document).ready(function () {
        if ($.fn.fancybox) {
            $('.elementor-widget-antra-gallery-scroll .gallery-image-link').fancybox({
                loop: false,
                clickOutside: "close",
                thumbs: {
                    autoStart: true
                }
            });
        }
    });

})(jQuery);

