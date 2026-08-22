(function ($) {
    "use strict";

    function init_view($scope) {
        if ($scope.find('.antra-panorama').hasClass('init-panorama')) {
            return;
        }

        var panorama, viewer, container;
        var antra_panorama = $('.antra-panorama', $scope),
            data = antra_panorama.data('settings') || {};
        
        container = $scope[0].querySelector('.antra-panorama');
        if (!container) return;

        // Use base64 panorama data if available, ensuring 100% offline & local file:// support without CORS blocks
        var imgSrc = '';
        if (typeof ANTRA_PANORAMA_DEFAULT_B64 !== 'undefined' && ANTRA_PANORAMA_DEFAULT_B64) {
            imgSrc = ANTRA_PANORAMA_DEFAULT_B64;
        } else if (data.img && (data.img.indexOf('data:') === 0)) {
            imgSrc = data.img;
        } else if (data.img && data.img.indexOf('http') === 0 && !data.img.includes('wpopal.com')) {
            imgSrc = data.img;
        } else {
            imgSrc = './wp-content/uploads/2025/06/virtual-tours6.jpg';
        }

        try {
            panorama = new PANOLENS.ImagePanorama(imgSrc);
            
            panorama.addEventListener('error', function() {
                if (typeof ANTRA_PANORAMA_DEFAULT_B64 !== 'undefined' && imgSrc !== ANTRA_PANORAMA_DEFAULT_B64) {
                    var fallbackPano = new PANOLENS.ImagePanorama(ANTRA_PANORAMA_DEFAULT_B64);
                    if (viewer) {
                        viewer.add(fallbackPano);
                        viewer.setPanorama(fallbackPano);
                    }
                }
            });

            viewer = new PANOLENS.Viewer({
                container: container,
                cameraFov: 90,
                autoRotate: true,
                autoRotateSpeed: 0.6,
                autoRotateActivationDuration: 3000,
                controlBar: true
            });
            viewer.add(panorama);
            $scope.find('.antra-panorama').addClass('init-panorama');
        } catch (err) {
            console.error('Panolens init error:', err);
        }
    }

    $(window).on('elementor/frontend/init', () => {
        if (typeof elementorFrontend !== 'undefined' && elementorFrontend.hooks) {
            elementorFrontend.hooks.addAction('frontend/element_ready/antra-project-image-panorama.default', ($scope) => {
                if ($scope.closest('.e-n-tabs-content').length) {
                    elementorFrontend.elements.$window.on('elementor/nested-tabs/activate', function($requestedContent) {
                        init_view($scope);
                    });
                } else {
                    init_view($scope);
                }
            });
        }
    });

    $(document).ready(function() {
        setTimeout(function() {
            $('.elementor-widget-antra-project-image-panorama').each(function() {
                init_view($(this));
            });
        }, 300);
    });
})(jQuery);