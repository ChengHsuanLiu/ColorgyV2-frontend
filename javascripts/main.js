/*
 * Toastr
 * Copyright 2012-2015
 * Authors: John Papa, Hans Fjällemark, and Tim Ferrell.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * ARIA Support: Greta Krafsig
 *
 * Project: https://github.com/CodeSeven/toastr
 */
/* global define */

; (function (define) {
    define(['jquery'], function ($) {
        return (function () {
            var $container;
            var listener;
            var toastId = 0;
            var toastType = {
                error: 'error',
                info: 'info',
                success: 'success',
                warning: 'warning'
            };

            var toastr = {
                clear: clear,
                remove: remove,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                subscribe: subscribe,
                success: success,
                version: '2.1.1',
                warning: warning
            };

            var previousToast;

            return toastr;

            ////////////////

            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function getContainer(options, create) {
                if (!options) { options = getOptions(); }
                $container = $('#' + options.containerId);
                if ($container.length) {
                    return $container;
                }
                if (create) {
                    $container = createContainer(options);
                }
                return $container;
            }

            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function subscribe(callback) {
                listener = callback;
            }

            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function clear($toastElement, clearOptions) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if (!clearToast($toastElement, options, clearOptions)) {
                    clearContainer(options);
                }
            }

            function remove($toastElement) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if ($toastElement && $(':focus', $toastElement).length === 0) {
                    removeToast($toastElement);
                    return;
                }
                if ($container.children().length) {
                    $container.remove();
                }
            }

            // internal functions

            function clearContainer (options) {
                var toastsToClear = $container.children();
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast($(toastsToClear[i]), options);
                }
            }

            function clearToast ($toastElement, options, clearOptions) {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || $(':focus', $toastElement).length === 0)) {
                    $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    });
                    return true;
                }
                return false;
            }

            function createContainer(options) {
                $container = $('<div/>')
                    .attr('id', options.containerId)
                    .addClass(options.positionClass)
                    .attr('aria-live', 'polite')
                    .attr('role', 'alert');

                $container.appendTo($(options.target));
                return $container;
            }

            function getDefaults() {
                return {
                    tapToDismiss: true,
                    toastClass: 'toast',
                    containerId: 'toast-container',
                    debug: false,

                    showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                    showDuration: 300,
                    showEasing: 'swing', //swing and linear are built into jQuery
                    onShown: undefined,
                    hideMethod: 'fadeOut',
                    hideDuration: 1000,
                    hideEasing: 'swing',
                    onHidden: undefined,

                    extendedTimeOut: 1000,
                    iconClasses: {
                        error: 'toast-error',
                        info: 'toast-info',
                        success: 'toast-success',
                        warning: 'toast-warning'
                    },
                    iconClass: 'toast-info',
                    positionClass: 'toast-top-right',
                    timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
                    contentClass: 'toast-content',
                    titleClass: 'toast-title',
                    messageClass: 'toast-message',
                    actionsClass: 'toast-actions',
                    target: 'body',
                    closeHtml: '<button type="button">&times;</button>',
                    newestOnTop: true,
                    preventDuplicates: false,
                    progressBar: false
                };
            }

            function publish(args) {
                if (!listener) { return; }
                listener(args);
            }

            function notify(map) {
                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;

                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = $.extend(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }

                if (shouldExit(options, map)) { return; }

                toastId++;

                $container = getContainer(options, true);

                var intervalId = null;
                var $toastElement = $('<div/>');
                var $titleElement = $('<div/>');
                var $actionsElement = $('<div/>');
                var $messageElement = $('<div/>');
                var $contentElement = $('<div/>');
                $contentElement.addClass(options.contentClass);
                var $progressElement = $('<div/>');
                var $closeElement = $(options.closeHtml);
                var progressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };
                var response = {
                    toastId: toastId,
                    state: 'visible',
                    startTime: new Date(),
                    options: options,
                    map: map
                };

                personalizeToast();

                displayToast();

                handleEvents();

                publish(response);

                if (options.debug && console) {
                    console.log(response);
                }

                return $toastElement;

                function personalizeToast() {
                    setIcon();
                    setTitle();
                    setMessage();
                    $toastElement.append($contentElement);
                    setActions();
                    setCloseButton();
                    setProgressBar();
                    setSequence();
                }

                function handleEvents() {
                    $toastElement.hover(stickAround, delayedHideToast);
                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.click(hideToast);
                    }

                    if (options.closeButton && $closeElement) {
                        $closeElement.click(function (event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                                event.cancelBubble = true;
                            }
                            hideToast(true);
                        });
                    }

                    if (options.onclick) {
                        $toastElement.click(function () {
                            options.onclick();
                            hideToast();
                        });
                    }
                }

                function displayToast() {
                    $toastElement.hide();

                    $toastElement[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing, complete: options.onShown}
                    );

                    if (options.timeOut > 0) {
                        intervalId = setTimeout(hideToast, options.timeOut);
                        progressBar.maxHideTime = parseFloat(options.timeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                        if (options.progressBar) {
                            progressBar.intervalId = setInterval(updateProgress, 10);
                        }
                    }
                }

                function setIcon() {
                    if (map.iconClass) {
                        $toastElement.addClass(options.toastClass).addClass(iconClass);
                    }
                }

                function setSequence() {
                    if (options.newestOnTop) {
                        $container.prepend($toastElement);
                    } else {
                        $container.append($toastElement);
                    }
                }

                function setActions() {
                    if (options.actions) {
                        actions = options.actions;
                        if (typeof(actions) === 'object') {
                            for (var k in actions) {
                                var action = actions[k];
                                var $action = $('<a/>');
                                $action.html(action[0]);
                                $action.click(action[1]);
                                $actionsElement.append($action);
                            }
                            $actionsElement.addClass(options.actionsClass);
                            $toastElement.append($actionsElement);
                        } else {
                            $actionsElement.append(options.actions).addClass(options.actionsClass);
                            $toastElement.append($actionsElement);
                        }
                    }
                }

                function setTitle() {
                    if (map.title) {
                        $titleElement.append(map.title).addClass(options.titleClass);
                        $contentElement.append($titleElement);
                    }
                }

                function setMessage() {
                    if (map.message) {
                        $messageElement.append(map.message).addClass(options.messageClass);
                        $contentElement.append($messageElement);
                    }
                }

                function setCloseButton() {
                    if (options.closeButton) {
                        $closeElement.addClass('toast-close-button').attr('role', 'button');
                        $toastElement.prepend($closeElement);
                    }
                }

                function setProgressBar() {
                    if (options.progressBar) {
                        $progressElement.addClass('toast-progress');
                        $toastElement.prepend($progressElement);
                    }
                }

                function shouldExit(options, map) {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        } else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }

                function hideToast(override) {
                    if ($(':focus', $toastElement).length && !override) {
                        return;
                    }
                    clearTimeout(progressBar.intervalId);
                    return $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () {
                            removeToast($toastElement);
                            if (options.onHidden && response.state !== 'hidden') {
                                options.onHidden();
                            }
                            response.state = 'hidden';
                            response.endTime = new Date();
                            publish(response);
                        }
                    });
                }

                function delayedHideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }

                function stickAround() {
                    clearTimeout(intervalId);
                    progressBar.hideEta = 0;
                    $toastElement.stop(true, true)[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing}
                    );
                }

                function updateProgress() {
                    var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
                    $progressElement.width(percentage + '%');
                }
            }

            function getOptions() {
                return $.extend({}, getDefaults(), toastr.options);
            }

            function removeToast($toastElement) {
                if (!$container) { $container = getContainer(); }
                if ($toastElement.is(':visible')) {
                    return;
                }
                $toastElement.remove();
                $toastElement = null;
                if ($container.children().length === 0) {
                    $container.remove();
                    previousToast = undefined;
                }
            }

        })();
    });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'));
    } else {
        window['toastr'] = factory(window['jQuery']);
    }
}));
// toast messages adopter
//
// API: toast.info(message, actions, title);
//            ^
//            can be info, success, error or warning
//
// The "actions" parameter can be a string of HTML, or an array containing
// title and callbacks like this:
//
//   cancelCallback = function() { alert('Canceled!'); };
//   showDetailsCancelCallback = function() { alert('Canceled!'); };
//   [['Cancel', function() { alert('Canceled!'); }], ['Details', function() { alert('Yo!'); }]]
//


toast = {};

toast.count = 0;
toast.onShown = function() {
  toast.count++;
  var $toast = toast.hideFirstToast();
  setTimeout(function() {
    $toast.css({
      'margin-top': '0',
      '-moz-transition-property': 'margin, margin-top',
      '-o-transition-property': 'margin, margin-top',
      '-webkit-transition-property': 'margin, margin-top',
      'transition-property': 'margin, margin-top',
      '-moz-transition-duration': '0.3s',
      '-o-transition-duration': '0.3s',
      '-webkit-transition-duration': '0.3s',
      'transition-duration': '0.3s'
    });
  }, 10);
};

toast.hideFirstToast = function() {
  var $target = $('#toast-container .toast:first-of-type');
  var tHight = $target.outerHeight(true);
  $target.css({
    'margin-top': '-' + (tHight) + 'px',
    '-moz-transition-property': 'none',
    '-o-transition-property': 'none',
    '-webkit-transition-property': 'none',
    'transition-property': 'none',
    '-moz-transition-duration': '0',
    '-o-transition-duration': '0',
    '-webkit-transition-duration': '0',
    'transition-duration': '0'
  });
  return $target;
};

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-center",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": 0,
  "hideDuration": 1000,
  "timeOut": 5000,
  "extendedTimeOut": 800,
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut",
  "onShown": toast.onShown
};

toast.info = function(message, actions, title) {
  toastr.info(message, title, { 'actions': actions });
};

toast.notice = toast.info;

toast.success = function(message, actions, title) {
  toastr.success(message, title, { 'actions': actions });
};

toast.error = function(message, actions, title) {
  toastr.error(message, title, { 'actions': actions });
};

toast.warning = function(message, actions, title) {
  toastr.warning(message, title, { 'actions': actions });
};

toast.alert = toast.warning;

window.toast = toast;

// Alias
window.flash = toast;
$('.message-close-btn').click(function(){
	$(this).parent('.message').remove();
	console.log('hi');
})
;



$(document).on('click', '.popup-btn', function(){
	$(this).parent().parent('.popup-notification').addClass('close');
})
$(document).on('click', '.steps-intro-btn', function(){
	$('.group-leader-notice').addClass('active');
})
$(document).on('click', '.notice-btn', function(){
	$('.black-mask').removeClass('active');
	$('.layer1').addClass('active');
	$("html").removeClass('lock');
	$("body").removeClass('lock');
})
$(window).scroll(function(){
	var windowWidth = window.innerWidth;
	if( windowWidth > 992 ){
		var windowOffsetTop = $('.navbar-fixed').children("nav").height();
		if($(this).scrollTop() >= windowOffsetTop){
			$('.nav-wrapper').addClass('scroll-down');
		}
		else{
			$('.nav-wrapper').removeClass('scroll-down');
		}
	}
});

$('.slide-field-trigger').click(function(){
	var triggerName = $(this).attr('href');
	var targetName = triggerName.substring(1, triggerName.length);
	$('#' + targetName).slideToggle(300);
});

$('.collapse-field-with-title .title').click(function(){
	$(this).children('.trigger').toggleClass('active');
	$(this).siblings('.content').slideToggle(300);
});

function popupNotice(title, content){
	$('.black-mask').addClass('active');

	$('<div class="popup-notification"><div class="popup-title">'
			+ title +
		'</div><div class="popup-content"><div class="row"><div class="col-md-12"><p>'
			+ content +
		'</p></div></div></div><div class="popup-footer"><button class="popup-btn notice-btn">了解</button></div></div>').appendTo('body');
}
;
