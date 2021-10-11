(function($) {

  $('#js-mobile-toggle').on('click', function () {

    $('body').addClass('c-mobile--active');
    return false;

  });

  $('#js-mobile-close').on('click', function () {

    $('body').removeClass('c-mobile--active');
    return false;

  });

  $('#js-go-top-btn').on('click', function (){

    window.scrollTo(0, 0);
    return false;

  });

  $('.c-senav__item').on('click', function () {

    $(this).addClass('active');
    return false;

  });

  $('.c-senav__close').on('click', function () {

    $(this).closest('.c-senav__item').removeClass('active');
    return false;
    
  });

})(jQuery);