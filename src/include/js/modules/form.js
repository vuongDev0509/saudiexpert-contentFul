(function($) {


  var SE = {

    apiURL: false,
    apiAuthURL: false,
    loader: $('#js-loader'),
    accessToken: 'IwgdTwgJR1iQKDdCwe46dAZMQhDSAUYS1WYXyrFyQavYMjO8H5u9+w==',
    apiAuthKey: false,
    headers: {},
    userName: 'crmadmin',
    isNewUser: false,
    customerGuid: false,
    formRegisterStatus: true,
    dataCompanies: [],
    debug: false,
    init: function () {

      var ts = new Date().getTime(); 
      

      $.getJSON( "/env.json?" + ts, function( data ) {
 
        SE.apiURL= data.api;
        SE.apiAuthURL = data.apiAuth;
        SE.debug = data.debug;

        if (SE.debug) console.log('DEBUGGING MODE IS ON')

        if (data.sentry) {

          Sentry.init({
            dsn: data.sentry,
            release: "saudi-expert-1.0",
            integrations: [new Sentry.Integrations.BrowserTracing()],
            tracesSampleRate: 1.0,
          });

        }

        // $.ajax({
        //   method: 'OPTIONS',
        //   url: SE.apiAuthURL,
        //   headers: {
        //     "Access-Control-Request-Method": "POST"
        //   },
        //   success: function (response) {
        //     console.log('Preflight success');
        //   }
        // });

        $.ajax({
          type: "post",
          url: SE.apiAuthURL,
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          data: "{\"encrypt\":\"" + moment().utc().format("YYYYMMDD") + "\"}",
          dataType: "json",
          success: function (response) {
           
            if (SE.apiURL && response.apiauthkey) {

              SE.apiAuthKey = response.apiauthkey;

              SE.headers = {
                "apitoken": SE.accessToken,
                "apiauthkey": SE.apiAuthKey,
                "Content-Type": "application/json"
              };

              if (SE.debug) console.log('headers', SE.headers);

              // Load drop down list item via API
              SE.loadRegion();
              SE.loadCountries();
              SE.loadCompany();
    
              SE.events();
              SE.formSubscribe();
              SE.formRegister();
              
            } else {
              if (SE.debug) console.log('Unable to retrieve apiAuthKey');
              Sentry.captureException("Unable to retrieve apiAuthKey");
            }
            
          }
        });

      });

    },

    formSubscribe: function () {

      /****************************************/
      // Step 1 form
      // Submit email and check for its existence
      /****************************************/
      $('form#form-subscribe').on('submit', function() {

        if ($(this).parsley().isValid()) {

          // Set email for second form
          var email = $('#js-sub-email').val();
          $('#js-email').val(email);

          var settings = {
            "url": SE.apiURL + "/Customer/PostRetrieveContact",
            "method": "POST",
            "timeout": 0,
            "headers": SE.headers,
            "data": JSON.stringify(
              {
                "retrieveCustomer": {
                  "Email" : email
                },
                "authenticateDetails": {
                  "UserName" : "crmadmin"
                }
              }
            ),
            "beforeSend": function () {
              SE.loader.addClass('active');
            }
          };

          $.ajax(settings).done(function (response) {
            if (SE.debug) console.log('Response - Subscribe', response);

            if (response.apiResult.resultCode === '0') {

              if (response.apidataObj) {
                SE.setupRegisterForm(false);
                
                try {
                  SE.customerGuid = response.apidataObj._firstContactRecord[0].CustomerGuid;
                } catch (e) {
                  if (SE.debug) console.log('PostRetrieveContact Success but unable to retrieve Guid');
                  Sentry.captureException("PostRetrieveContact Success but unable to retrieve Guid");
                }

                SE.isNewUser = false;
                if (SE.debug) console.log('User Guid', SE.customerGuid)
              } else {
                SE.setupRegisterForm(true);
                SE.isNewUser = true;
              }

            } else if (response.apiResult.resultCode === '1') {
              SE.setupRegisterForm(true);
              SE.isNewUser = true;
            } else {
              if (SE.debug) console.log('PostRetrieveContact Succes but invalid response')
              Sentry.captureException("PostRetrieveContact Succes but invalid response");
            }

          }).fail(function () {
            Sentry.captureException("PostRetrieveContact AJAX call failed");
          }).always(function () {
            setTimeout(function () {
              SE.loader.removeClass('active'); 
              $('#js-seform-subscribe-thanks').addClass('active');
              $('#js-seform-subscribe').removeClass('active');
            }, 1000);
          });


        }

        return false;
      });

    },

    formRegister: function () {
      

      /****************************************/
      // Step 2 form submission
      /****************************************/
      $('form#form-register').on('submit', function() {

        var $form = $(this);

        SE.validateRegisterForm();

        if (SE.formRegisterStatus === true) {
          
          var company_id = SE.checkCompanyNameExist($('#js-company-name').val());

          // Prepare selected International Market array
          var im = [];
          var selected_im = $('#js-im').val();
          for(var item in selected_im) {
            im.push({'Id' : selected_im[item]});
          }


          var settings = {
            "method": "POST",
            "timeout": 0,
            "headers": SE.headers,
            "beforeSend": function () {
              SE.loader.addClass('active');
            }
          };

          if (SE.isNewUser) {

            // Create new company first
            // if company dropdown is empty and passed the validation
            // that means it's a new company
            if (!company_id) {
              var com_settings = settings; // Copy API template
              com_settings.url = SE.apiURL + '/Accounts/CreateCompany';
              com_settings.data = JSON.stringify({
                "createCompany": {
                  "CompanyName": $('#js-company-name').val(),
                  "Country": {
                    "Id" : $('#js-company-countries').val()
                  },
                  "Region": {
                    "Id" : $('#js-region').val()
                  },
                  "SubRegion": {
                    "Id" : $('#js-sub-region').val()
                  },
                  "City": {
                    "Id" : $('#js-city').val()
                  },
                  "LeadType":"1",
                  "InternationalMarkets": im,
                  "SaudiTourismContent" : $('#capability_building').is(':checked') ? 'Yes' : 'No',
                  "CapabilityBuildingProgram" : $('#sa_content').is(':checked') ? 'Yes' : 'No'
                },
                "authenticateDetails": {
                  "UserName": "crmadmin"
                }
             });
             
              $.ajax(com_settings).done(function (response) {
                if (SE.debug) console.log('Response - CreateCompany', response);

                if (response.apiResult.resultCode === '0') {
                  company_id = response.apidataObj.CompanyGuid;
                } else {
                  company_id = false
                  $('.alert--warning').removeClass('hidden');
                  if (SE.debug) console.log('Company name not found in GetCompanyNames API and unable to create new company.');
                  if (SE.debug) console.log('CreateCompany', response.apiResult.resultDesDetails);
                  Sentry.captureException("CreateCompany " + response.apiResult.resultDesDetails);
                }

                // Proceed to register the user when company has been created.
                if (company_id) {
                  settings.url = SE.apiURL + '/Customer/CreateContact';
                  settings.data = JSON.stringify({
                    "createCustomer": {
                     "FirstName": $('#js-firstname').val(),
                     "LastName": $('#js-surname').val(),
                     "PrimaryEmail": $('#js-email').val(),
                     "PrimaryContactNo": $('#js-phone').val(),
                     "CompanyName": {"Id": company_id},
                     "Country": {"Id": $('#js-countries').val()},
                     "LeadType": $('#js-field-program').val(),
                     "InternationalMarkets": im,
                       "SaudiTourismContent" : $('#capability_building').is(':checked') ? 'Yes' : 'No',
                      "CapabilityBuildingProgram" : $('#sa_content').is(':checked') ? 'Yes' : 'No'
                    },
                   "authenticateDetails": {
                    "UserName": "crmadmin"
                   }
                 });

                  if (SE.debug) console.log('Setting - Register', settings);
                  SE.ajaxSubmission(settings);

                }


              }).fail(function () {
                if (SE.debug) console.log('Unable to create your form');
              }).always(function () {
                SE.loader.removeClass('active'); 
              });

            } else {

              // Proceed to register the user when company has been created.
              settings.url = SE.apiURL + '/Customer/CreateContact';
              settings.data = JSON.stringify({
                "createCustomer": {
                 "FirstName": $('#js-firstname').val(),
                 "LastName": $('#js-surname').val(),
                 "PrimaryEmail": $('#js-email').val(),
                 "PrimaryContactNo": $('#js-phone').val(),
                 "CompanyName": {"Id": company_id},
                 "Country": {"Id": $('#js-countries').val()},
                 "LeadType": $('#js-field-program').val(),
                 "InternationalMarkets": im,
                   "SaudiTourismContent" : $('#capability_building').is(':checked') ? 'Yes' : 'No',
                  "CapabilityBuildingProgram" : $('#sa_content').is(':checked') ? 'Yes' : 'No'
                },
               "authenticateDetails": {
                "UserName": "crmadmin"
               }
             });

              if (SE.debug) console.log('Setting - Register', settings);
              SE.ajaxSubmission(settings);

            }              

          } else {

          } 

        } else {
          if (SE.debug) console.log('Form validation failed');
        }

        return false;
      });  


    },

    ajaxSubmission: function (settings) {

      $.ajax(settings).done(function (response) {

        if (SE.debug) console.log('Response - Register', response);

        if (response.apiResult.resultCode === '0') {

          $('#js-seform-register-thanks').addClass('active');
          $('#js-seform-subscribe-thanks').removeClass('active');

          $('html, body').animate({
            scrollTop: $('#form-content').offset().top
          }, 500);    
          
        } else {
          $('.alert--warning').removeClass('hidden');
          Sentry.captureException("CreateContact " + response.apiResult.resultDesDetails);
        }

      }).fail(function () {
        if (SE.debug) console.log('Unable to register.')
      }).always(function () {
        SE.loader.removeClass('active'); 
      });

    },

    validateRegisterForm: function () {

      // Always true until proven false
      SE.formRegisterStatus = true;

      //Recaptcha validation
      var response = grecaptcha.getResponse();

      if (!response) {
        $('#rc-error').text($('#rc-error').data('error'));
        SE.formRegisterStatus = false;
        if (SE.debug) console.log('Error', 'Google Recaptcha');
        $('.captcha').addClass('parent-error');
      } else {
        $('#rc-error').empty();
        $('.captcha').removeClass('parent-error');
      }

      // Validation based on user type
      if (SE.isNewUser) {

        $('.new-user-field input, .new-user-field select').each(function () {
          var $elm = $(this);
          var phone_regex = /^[\d\+\-\(\)\/\s]*$/;

          if ($elm.val() === '') {
            SE.setError($elm);
            if (SE.debug) console.log('Error', $elm.attr('name'));
          } else if ($elm.attr('type') === 'tel' && !phone_regex.test($elm.val())) {
            SE.setCustomError($elm, 'pattern-message');
            if (SE.debug) console.log('Error', $elm.attr('name'));
          } else {
            SE.clearError($elm);
          }
        });


        // Company validation
        $('#form-group-company .form-control').each(function () {
          var $elm = $(this);
          if ($elm.val() === '') {
            SE.setError($elm);
            if (SE.debug) console.log('Error', $elm.attr('name'));
          } else {
            SE.clearError($elm);
          }
        });

        var $term = $('#term');
        if (!$term.is(':checked')) {
          SE.setError($term);
        } else {
          SE.clearError($term);
        }
      


      } else {

        $('.existing-user-field input, .existing-user-field select').each(function () {
          var $elm = $(this);
          if ($elm.val() === '') {
            SE.setError($elm);
            if (SE.debug) console.log('Error', $elm.attr('name'));
          } else {
            SE.clearError($elm);
          }
        });

      }


      // International market validation
      $elm = $('#js-im');
      if ($('#form-group-dep').is(':visible') && $('input#international_markets').is(':checked') && $elm.val().length === 0) {
        SE.setError($elm);
        $elm.closest('.select-wrapper').addClass('error');
      } else {
        SE.clearError($elm);
        $elm.closest('.select-wrapper').removeClass('error');
      }

    },


    checkCompanyNameExist: function (name) {

      var searchFound = false;
      name = $.trim(name.toLowerCase());
      // Check to ensure Company name and Guid match
      for(var item in SE.dataCompanies) {
        //if (SE.debug)  console.log('Comparing Companies "' + name + '" width:', SE.dataCompanies[item]['name'].toLowerCase());
        if (name === SE.dataCompanies[item]['name'].toLowerCase()) {
          searchFound = SE.dataCompanies[item]['guid'];  
          if (SE.debug) console.log('Company found for ' + name , searchFound);        
        }
      }

      return searchFound;

    },

    events: function () {


      // Render Selec2 multi select drop down menu
      $('.select-tag').each(function () {
        var $this = $(this);
        $('#' + $this.attr('id')).select2({
          'placeholder': $this.data('placeholder')
        });
      });

      $('#js-add-company').on('click', function () {
        var $cur = $(this);
        var $parent = $cur.closest('.company');
        if ($cur.hasClass('active')) {
          $('#form-group-company').removeClass('active');
          $cur.removeClass('active');
          $cur.text($cur.data('default'));
          $parent.removeClass('active');
          $('#form-group-company input, #form-group-company select').val('');

          $('#form-group-company .form-control').each(function () {
            var $elm = $(this);
            SE.clearError($elm);
          });
          $('#js-company').prop('disabled', false);

        } else {
          $('#js-company, #js-company-guid').val('');
          $('#js-company').prop('disabled', true);
          $('#form-group-company').addClass('active');
          $cur.addClass('active');
          $cur.text($cur.data('cancel'));
          $parent.addClass('active');
          SE.clearError($('#js-company'));
        }
        
      });
    
      $('#js-field-program').on('change', function () {
        var $cur = $(this);
        var $dep = $('#form-group-dep');
    
        if ($cur.val() === "2") {
          $dep.addClass('active');
        } else {
          $dep.removeClass('active');
          $dep.find('input[type=checkbox]').prop('checked', false);
          $dep.find('select').val('').trigger('change');
          $('#form-group-im').removeClass('active');
        }
    
      });
    
      $('#international_markets').on('change click', function () {
        var $cur = $(this);
        var $im = $('#form-group-im');
    
        if ($cur.is(':checked')) {
          $im.addClass('active');
        } else {
          $im.removeClass('active');
        }
    
      });      

      $('#js-region').on('change', function () {
        var $cur = $(this);

        if ($cur.val()) {
          SE.loadSubRegion($cur.val());          
        }

      });

      $('#js-company-countries').on('change', function () {
        var $cur = $(this);

        if ($cur.val()) {
          SE.loadCity($cur.val());          
        }

      });


    },

    setupRegisterForm: function(isNewUser) {

      if (isNewUser) {
        $('.c-seform__content').addClass('new');
      } else {
        $('.c-seform__form').remove();
        $('.c-seform__content').addClass('exist');
      }
  
    },

    setCustomError: function($elm, message) {
      var $parent = $elm.closest('.form-col');
      var $message = $parent.find('.required-error');
  
      $elm.addClass('error');
      $elm.parent().addClass('parent-error');
      $message.empty().addClass('show-error').text($elm.data(message));
      SE.formRegisterStatus = false;

    },


    setError: function($elm) {
      var $parent = $elm.closest('.form-col');
      var $message = $parent.find('.required-error');
  
      $elm.addClass('error');
      $elm.parent().addClass('parent-error');
      $message.empty().addClass('show-error').text($elm.data('required-message'));
      SE.formRegisterStatus = false;

    },

    clearError: function ($elm) {
      try {
      var $parent = $elm.closest('.form-col');
      var $message = $parent.find('.required-error');
      $elm.removeClass('error');
      $elm.parent().removeClass('parent-error');
      $message.removeClass('show-error').empty();
      } catch (e) {
        if (SE.debug) console.log(e);
      }
    },
  
    loadCountries: function() {
  
      var $select = $('#js-countries, #js-company-countries');
  
      $.ajax({
        type: "GET",
        url: SE.apiURL + '/Countries/GetCountries',
        dataType: "json",
        headers: SE.headers,
        beforeSend: function () {
          SE.loader.addClass('active');
        },
        error: function () {
          if (SE.debug) console.log('Unable to access API');
          Sentry.captureException("GetCountries unable to access API");
        },
        success: function (response) {  

          if (response.apiResult.resultCode === '0') {
            var countries = response.apidataObj.countriesDataObj;
            //if (SE.debug) console.log('Markets', countries);
            for(var item in countries) {
              $select.append('<option value="'  + countries[item]['CountryGuid'] + '">' + countries[item]['CountryName'] + '</option>');
            };
            SE.loader.removeClass('active');
          } else {
            Sentry.captureException("GetCountries returns invalid data");
          }
          
        }
      });
  
    },
  
    loadRegion: function() {
  
      var $select = $('#js-im, #js-region');
  
      $.ajax({
        type: "GET",
        url: SE.apiURL + '/Regions/GetInternationalMarkets',
        dataType: "json",
        headers: SE.headers,
        beforeSend: function () {
          SE.loader.addClass('active');
        },
        error: function () {
          if (SE.debug) console.log('Unable to access API');
          Sentry.captureException("GetCountries unable to access API");
        },
        success: function (response) {  

          if (response.apiResult.resultCode === '0') {
            var markets = response.apidataObj.regionDataObj;
            //if (SE.debug) console.log('Markets', markets);
            for(var item in markets) {
              $select.append('<option value="'  + markets[item]['RegionGuid'] + '">' + markets[item]['RegionName'] + '</option>');
            };
            SE.loader.removeClass('active');
          } else {
            Sentry.captureException("GetInternationalMarkets returns invalid data");
          }

        }
      });
  
    },

    loadSubRegion: function(regionID) {
  
      var $select = $('#js-sub-region');
      
      $select.find('option').remove();

      $.ajax({
        type: "GET",
        url: SE.apiURL + '/SubRegions/GetSubRegions',
        dataType: "json",
        headers: SE.headers,
        beforeSend: function () {
          $select.append('<option value="">Loading...</option>');
          $select.prop('disabled', true);
        },
        error: function () {
          if (SE.debug) console.log('Unable to access API');
          Sentry.captureException("GetCountries unable to access API");
        },
        data: {regionId: regionID},
        success: function (response) {  

          if (response.apiResult.resultCode === '0') {
            var subregions = response.apidataObj.SubregionDataObj;
            //if (SE.debug) console.log('Sub Regions', subregions);
            for(var item in subregions) {
              $select.append('<option value="'  + subregions[item]['SubRegionGuid'] + '">' + subregions[item]['SubRegionName'] + '</option>');
            };
          }  else {
            Sentry.captureException("Sub Region returns invalid data");
          }

          $select.find('option:first').text('Please select...');
          $select.prop('disabled', false);
        }
      });
  
    },

    loadCity: function(countryID) {
  
      var $select = $('#js-city');
      
      $select.find('option').remove();

      $.ajax({
        type: "GET",
        url: SE.apiURL + '/Cities/GetCities',
        dataType: "json",
        headers: SE.headers,
        beforeSend: function () {
          $select.append('<option value="">Loading...</option>');
          $select.prop('disabled', true);
        },
        error: function () {
          if (SE.debug) console.log('Unable to access API');
          Sentry.captureException("GetCountries unable to access API");
        },
        data: {CountryId: countryID},
        success: function (response) {  

          if (response.apiResult.resultCode === '0') {
            var cities = response.apidataObj.citiesDataObj;
            //if (SE.debug) console.log('Cities', cities);
            for(var item in cities) {
              $select.append('<option value="'  + cities[item]['CityGuid'] + '">' + cities[item]['CityName'] + '</option>');
            };
          } else {
            Sentry.captureException("GetCities returns invalid data");
          }

          $select.find('option:first').text('Please select...');
          $select.prop('disabled', false);
        }
      });
  
    },
  
  
    loadCompany:function () {
  
      $.ajax({
        type: "GET",
        url: SE.apiURL + '/Accounts/GetCompanyNames',
        dataType: "json",
        beforeSend: function () {
          SE.loader.addClass('active');
        },
        headers: SE.headers,
        error: function () {
          if (SE.debug) console.log('Unable to access API');
          Sentry.captureException("GetCountries unable to access API");
        },
        success: function (response) {  

          if (response.apiResult.resultCode === '0') {
            var companies = response.apidataObj.accountDataObj;
            //if (SE.debug) console.log('Companies', companies);
            for(var item in companies) {

              SE.dataCompanies.push({
                'name' : companies[item]['CompanyName'] ,
                'guid' : companies[item]['CompanyGuid']
              });

            };

            var options = {
              data: SE.dataCompanies,
              getValue: "name",
              list: {
                match: {
                  enabled: true,
                  method: function(element, phrase) {
                    if(phrase.length < 1) return false;
                    if(phrase.length == 1){
                      return element.split(" ")[0] === phrase;
                    }
                    if (element.search(phrase) > -1){
                      return true;
                    } else {
                      return false;
                    }
                  }
                },
                onSelectItemEvent: function() {
                  var value = $("#js-company").getSelectedItemData().guid;
                  $('#js-company-guid').val(value);
                }
              }
            };

            $("#js-company").on('keyup keydown', function () {
              $('#js-company-guid').val('');
            });
            $("#js-company").easyAutocomplete(options);


            SE.loader.removeClass('active');
          } else {
            Sentry.captureException("GetCompanyName returns invalid data");
          }
        }
      });
  
    }
  

  };


  SE.init();

})(jQuery);