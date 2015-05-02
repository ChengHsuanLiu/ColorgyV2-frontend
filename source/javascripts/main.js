$('.popup-btn').click(function(){
	$(this).parent().parent('.popup-notification').addClass('close');
})
$('.steps-intro-btn').click(function(){
	$('.group-leader-notice').addClass('active');
})
$('.group-leader-notice-btn').click(function(){
	$('.black-mask').removeClass('active');
	$('.layer2').addClass('active');
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
})
