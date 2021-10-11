(function($) {

  /* 
  ** Scroll goto
  */  
  $('.goto').on('click', function () {
    var hash = $(this).attr('href');
    $('html, body').animate({
      scrollTop: $(hash).offset().top
    }, 1000);     
    return false;
  });


  /*
  ** Event equalheight
  */
  var resizeTimer;
  equalHeight('.c-senav__item-wrapper', 767, '.c-senav__item-wrapper');

  $(window).resize(function () {

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      equalHeight('.c-senav__item-wrapper', 767, '.c-senav__item-wrapper');
    }, 500);
  });
 
  function equalHeight(elm, mobileWidth, target) {
 
    var tallest = 0;
    var $block = $(elm);
    $(target).css('min-height', 0);
    
    if ($(window).width() > mobileWidth) {
 
      $block.each(function (x) {
        if ($(this).outerHeight() > tallest) {
          tallest = $(this).outerHeight(); 
        }
      });   
      $(target).css('min-height', tallest);
 
    }
 
  }




})(jQuery);


