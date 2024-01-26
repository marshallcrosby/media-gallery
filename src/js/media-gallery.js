/*!
    * Media Gallery v1.0.0
    * Display media in a Swiper slider inside a Bootstrap modal.
    *
    * Copyright 2024 Blend Interactive
    * https://blendinteractive.com
*/


const swiperVersion = '11.0.5';

const externalSrc = {
    youtube: 'https://www.youtube.com/iframe_api',
    vimeo: 'https://player.vimeo.com/api/player.js',
    swiperScript: `https://cdnjs.cloudflare.com/ajax/libs/Swiper/${swiperVersion}/swiper-bundle.min.js`,
    swiperCSS: `https://cdnjs.cloudflare.com/ajax/libs/Swiper/${swiperVersion}/swiper-bundle.min.css`
}

const mediaGallery = () => {
    
    // FUNCTION DEF: load external src
    const loadExternalSrc = (src, type, callback) => {
        const tag = (type === 'script') ? document.createElement('script') : document.createElement('link');
        const srcAttr = (type === 'script') ? 'src' : 'href';
        
        if (type === 'stylesheet') {
            tag.setAttribute('rel', 'stylesheet');
        }
        
        tag.setAttribute(srcAttr, src);
        
        if (type === 'script') {
            document.body.appendChild(tag);
        } else if (type === 'stylesheet') {
            document.querySelector('head').appendChild(tag);
        }
        
        tag.onload = callback;
    }

    // Load swiper assets if needed
    const mediaItemEl = document.querySelectorAll('.media-gallery__item');
    
    const globalStyles = window.getComputedStyle(document.documentElement);
    const swiperCSSVar = globalStyles.getPropertyValue('--swiper-theme-color');
    
    if (mediaItemEl) {
        if (!swiperCSSVar) {
            loadExternalSrc(externalSrc.swiperCSS, 'stylesheet');
        }

        if (typeof Swiper === 'undefined') {
            loadExternalSrc(externalSrc.swiperScript, 'script');
        }
    }

    const mediaViewerEl = document.querySelector('.media-viewer__swiper');
    const mediaViewerWrapEl = mediaViewerEl.querySelector('.media-viewer__wrapper');
       
    // FUNCTION DEF: Return service (youtube or vimeo) as well as video id 
    const getVideoInfo = (url) => {
        let vidInfo = {
            vendor: null,
            id: null
        };
    
        if (url.includes('vimeo.com')) {
            const vimeoRegex = /\/(?:playback\/)?(\d+)/;
            const vimeoMatch = url.match(vimeoRegex);
            
            if (vimeoMatch && vimeoMatch[1]) {
                vidInfo = {
                    vendor: 'vimeo',
                    id: vimeoMatch[1]
                }
                return vidInfo;
            }
        }
        
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
    
        if (youtubeMatch && youtubeMatch[1]) {
            vidInfo = {
                vendor: 'youtube',
                id: youtubeMatch[1]
            }
            return vidInfo;
        }
    
        return vidInfo;
    }
    
    // Add Youtube or Vimeo API script:src to DOM if needed
    const videoItem = document.querySelectorAll('[data-video-src]');
    let needYTApi = null;
    let needVimeoApi = null;
    
    for (const item of videoItem) {
        let videoInfo = getVideoInfo(item.getAttribute('data-video-src'));
        
        if (videoInfo.vendor === 'youtube') {
            needYTApi = true;
        }
        
        if (videoInfo.vendor === 'vimeo') {
            needVimeoApi = true;
        }
    }
        
    if (needYTApi) {
        const checkForYoutubeAPIScript = document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]');
        
        if (!checkForYoutubeAPIScript.length) {
            loadExternalSrc(externalSrc.youtube, 'script');
        }
        
        onYouTubeIframeAPIReady = () => {
            loadStatus++;
            console.log('Youtube API Ready');
        }
    }
    
    if (needVimeoApi) {
        const checkForVimeoAPIScript = document.querySelectorAll('script[src="https://player.vimeo.com/api/player.js"]');
    
        if (!checkForVimeoAPIScript.length) {
            loadExternalSrc(externalSrc.vimeo, 'script');
        }
    }

    let loadStatus = 0;
    let loadStatusCount = 0;

    if (needYTApi) {
        loadStatusCount = 1;
    }

    let mediaReadyEvent = new Event('mediaReadyEvent');
    
    // FUNCTION DEF: Build vimeo video instance
    let vimeoLoaded = 0;
    const vimeoBuilderAPI = (el, idstring) => {
        const uniqeuID = 'vimeoPlayer' + Math.floor(Math.random() * 1000000000);
        el.setAttribute('id', uniqeuID);
        el.classList.add('vimeo-player');
        
        const player = new Vimeo.Player(uniqeuID, {
            id: idstring,
        });
    
        // Pause video on swiper slide change
        player.on('loaded', () => {
            console.log(vimeoLoaded);
            mediaViewerEl.swiper.on('slideChange', () => {
                player.pause();
            });

            window.addEventListener('mediaModalClosedEvent', () => {
                player.pause();
            });

            const activeSlide = el.closest('.swiper-slide-active');
            if (vimeoLoaded === 0 && activeSlide) {
                window.dispatchEvent(mediaReadyEvent);
            }
            
            vimeoLoaded++
        });
    }
    
    // FUNCTION DEF: Build youtube video instance
    let youtubeLoaded = 0;
    const youtubeVideoBuilderAPI = (el, idstring) => {
        const uniqeuID = 'ytPlayer' + Math.floor(Math.random() * 1000000000);
        el.setAttribute('id', uniqeuID);
        el.classList.add('yt-player');
        
        let player;
        player = new YT.Player(uniqeuID, {
            videoId: idstring,
            height: '20000',
            width: '20000',
            playerVars: {
                'autoplay': 0,
                'controls': 1,
                'showinfo': 0,
                'rel': 0,
            },
            events: {
                'onReady': onPlayerReady,
            },
        });
    
        // Pause video on swiper slide change
        function onPlayerReady() {
            mediaViewerEl.swiper.on('slideChange', () => {
                player.pauseVideo();
            });

            window.addEventListener('mediaModalClosedEvent', () => {
                player.pauseVideo();
            });

            const activeSlide = el.closest('.swiper-slide-active');
            if (youtubeLoaded === 0 && activeSlide) {
                console.log('found');
                window.dispatchEvent(mediaReadyEvent);
            }

            youtubeLoaded++
        }
    }
    
    // FUNCTION DEF: Build HTML5 video instance
    let html5VideoReady = 0;
    const html5VideoBuilder = (el, src, posterSrc) => {
        const uniqeuID = 'html5VideoPlayer' + Math.floor(Math.random() * 1000000000);
        el.classList.add('html5-video-player');
        el.setAttribute('id', uniqeuID);
        el.setAttribute('controls', '');
        el.setAttribute('playsinline', '');
        el.setAttribute('poster', posterSrc);
        
        el.innerHTML = /* html */`
            <source src="${src}" type="video/mp4">
            Your browser does not support the video tag.
        `;
    
        // Pause video on swiper slide change
        el.addEventListener('loadstart', () => {
            mediaViewerEl.swiper.on('slideChange', () => {
                el.pause();
            });

            window.addEventListener('mediaModalClosedEvent', () => {
                el.pause();
            });

            const activeSlide = el.closest('.swiper-slide-active');
            if (html5VideoReady === 0 && activeSlide) {
                window.dispatchEvent(mediaReadyEvent);
            }

            html5VideoReady++
        })
    }
    
    // FUNCTION DEF: Build a new swiper when needed
    const mediaSwiperBuilder = (goToSlide) => {
        
        // Initialize swiper
        const swiper = new Swiper('.media-viewer__swiper', {
            autoHeight: true,
            speed: 400,
            spaceBetween: 4,
            navigation: {
                prevEl: '.media-viewer__button-prev',
                nextEl: '.media-viewer__button-next'
            },
            pagination: {
                el: '.media-viewer__slide-status',
                type: 'fraction'
            },
            keyboard: {
                enabled: true
            }
        });
    
        // Go to slide
        if (goToSlide) {
            swiper.slideTo(goToSlide, 0, false)
        }
    }
    
    // FUNCTION DEF: Destroy swiper instance and remove slide elements from the DOM
    const mediaSwiperDestroy = (el) => {
        const swiperEl = el;
        
        if (swiperEl) {
            el.swiper.destroy(true, true);
            el.querySelectorAll('.media-viewer__slide').forEach(item => item.remove());
        }
    }
    
    // Setup media modal triggers
    const mediaGroup = document.querySelectorAll('.media-gallery');
    let beforeModalFocusItem;
    let currentGroup;
    
    mediaGroup.forEach(group => {
        group.setAttribute('data-group-id', 'mediaGallery-' + Math.floor(Math.random() * 1000000000));
        const mediaGroupItems = group.querySelectorAll('.media-gallery__item');
        const mediaSwiperSlideEl = document.createElement('div');
        mediaSwiperSlideEl.classList.add('media-viewer__slide');
        mediaSwiperSlideEl.classList.add('swiper-slide');
        
        mediaGroupItems.forEach((item, index) => {
    
            // Set some attributes to help with a11y
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', 'View media');
    
            // When media item is clicked, add slides to the swiper wrapper element
            item.addEventListener('click', (e) => {
                
                // If new group is selected setup swiper
                if (currentGroup !== group.getAttribute('data-group-id')) {
                    
                    // Destroy swiper if new group is picked and it contains slide
                    if (mediaViewerWrapEl.children.length > 0) {
                        mediaSwiperDestroy(mediaViewerEl);
                    }

                    for (const element of mediaGroupItems) {
                        const slideEl = mediaSwiperSlideEl.cloneNode(true);
                        const videoSrc = element.getAttribute('data-video-src');
                        const mediaEl = element.querySelector('.media-gallery__media');
                        const mediaElCloned = (mediaEl) ? mediaEl.cloneNode(true) : null;
        
                        if (mediaElCloned) {
                            slideEl.appendChild(mediaElCloned);
                        }

                        mediaViewerWrapEl.appendChild(slideEl);
        
                        // Replace image with vendor video using their respective API
                        if (videoSrc) {
                            const videoInfo = getVideoInfo(videoSrc);
                            const videoDiv = (videoInfo.vendor !== null) ? document.createElement('div') : document.createElement('video');
                            slideEl.appendChild(videoDiv);
                            
                            if (videoInfo.vendor === 'youtube') {
                                youtubeVideoBuilderAPI(videoDiv, videoInfo.id);
                            }
                            
                            if (videoInfo.vendor === 'vimeo') {
                                vimeoBuilderAPI(videoDiv, videoInfo.id);
                            }
                            
                            if (videoInfo.vendor === null) {
                                html5VideoBuilder(videoDiv, videoSrc, mediaElCloned.src);
                            }
                            
                            if (mediaElCloned) {
                                mediaElCloned.remove();
                            }
                        }
                    }
        
                    // Initialize the media swiper and go to slide that was clicked
                    mediaSwiperBuilder(index);
                } else {
                    mediaViewerEl.swiper.slideTo(index, 0, false);
                }
                
                // Remember last focusable element before modal is shown
                beforeModalFocusItem = item;

                currentGroup = group.getAttribute('data-group-id');

                const activeImage = mediaViewerEl.querySelector('.swiper-slide-active img');
                
                if (activeImage) {
                    window.dispatchEvent(mediaReadyEvent)
                }
            });
    
            // Allow the enter key and spacebar to trigger the media modal (like a <button> element would)
            item.addEventListener('keydown', (e) => {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.target.click();
                }
            });
        });
    });
    
    const barLoaderEl = document.querySelector('.modal--media .bar-loader');
   
    // When media modal is opened do some stuff
    const mediaModalEl = document.getElementById('mediaModal');
    document.body.appendChild(mediaModalEl);

    mediaModalEl.addEventListener('shown.bs.modal', () => {
        setTimeout(() => {
            barLoaderEl.classList.add('bar-loader--hidden');
        }, 1000);

        window.addEventListener('mediaReadyEvent', () => {
            console.log('loading done');
        });
    });

    // When media modal is closed do some stuff
    let modalClosedEvent = new Event('mediaModalClosedEvent');
    mediaModalEl.addEventListener('hidden.bs.modal', () => {
        window.dispatchEvent(modalClosedEvent);
        
        // TODO: figure out a better way to do this. Shouldn't have rely on a setTimeout
        setTimeout(() => {
            barLoaderEl.classList.remove('bar-loader--hidden');
            beforeModalFocusItem.focus();
        }, 5);
    });
    
    // Figure out when the all the media items are ready
    function mediaGalleryReady() {
        if (loadStatus === loadStatusCount) {
            document.documentElement.classList.add('js-media-gallery--ready');
            return
        }
        
        setTimeout(mediaGalleryReady, 300);
    }
    
    mediaGalleryReady();
}