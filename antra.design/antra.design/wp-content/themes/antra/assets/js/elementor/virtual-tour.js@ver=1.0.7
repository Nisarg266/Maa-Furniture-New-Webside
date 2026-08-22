(function ($) {
    "use strict";

    function goNewWin() {
        window.open("https://www.w3schools.com");
    }

    function initVirtualTour($scope) {
        let VirtualTour = $('.elementor-virtual-tour-wrapper', $scope);
        VirtualTour.find('.antra-virtual-tour-item').each(function (i, obj) {
            let link = $('.elementor-virtual-tour', this).data('link');
            if (link) {
                $('.elementor-virtual-tour', this).on('click', function () {
                    window.open(link, 'thenewpop', 'scrollbars=yes,width=1200,height=600,status=1,left=45,top=0,');
                });
            }
        });
    }

    $(window).on('elementor/frontend/init', () => {
        const addHandler = ($element) => {
            elementorFrontend.elementsHandler.addHandler(antraSwiperBase, {
                $element,
            })

            var swiperContainer = $('.antra-swiper', $element);
            if (swiperContainer.length && !swiperContainer.hasClass('elementor-single-item')) {
                swiperContainer.on('swiperInit', function(e, slider) {
                    initVirtualTour($element);
                })
            } else {
                initVirtualTour($element);
            }
        }

        elementorFrontend.hooks.addAction('frontend/element_ready/antra-virtual-tour.default', addHandler);
    })
})
(jQuery);