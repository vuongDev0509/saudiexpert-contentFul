# Saudi Tourism Authority (STA)

The official B2B platform of the Saudi Tourism Authority for domestic, regional and international tourism partners.


## Front end

Frontend development is using NodeJs, Gulp, Sass and Npm. Development environment is using NodeJs v10.6.16.0 and Npm 6.9.0. You can download it here: https://nodejs.org/en/download/releases/

Gulp is setup for Sass compilation, CSS minification, JS concatenation and JS minification. When you're in the root folder of STA, navigate to **src** folder and run this command in the terminal.

    gulp

The command above will run all CSS and JS compilation and minification tasks and watch corresponding folder for any changes. You will able to start changing the code and it will recompile the changes automatically.

## API settings

There're a few set of API prepared for this build. We have local, staging and production. You can change the API URL in **env.json** located in STA root folder.

    {
    	"api": "url",
    	"sentry": "url",
    	"apiAuth": "url",  
    	"debug": true
    }

env.json has the above format, change the URL to the right API for testing. 

For **debug** property, set it to true, JS will output some useful logs for the debugging process.

## Javascript

The main logic for the form is located in *{STA root folder}/src/include/js/modules/form.js* From there, you will able to find accessToken and userName for the app. Here's the overview of the flow:

 1. On first load, it will get the API from **env.json**.
 2. Then, it send an AJAX request to get apiAuthKey, if the request is successful, it will go ahead to execute the rest of the functions.
 3. It will retrieve data for regions (loadRegion function), countries (loadCountries function) and companies  (loadCompany function).
 4. Then, bind all the UI events (events function) and followed by the subscribe form (formSubscribe function) and Register form (formRegister function).

## Subscribe form

There's only one email field for subscribe form. Once that's submitted, the return result will indicate either the email is registered or not registered. 

Existing user will have CustomerGuid. That's how we differentiate registered and non-registered users.

Depend on the user registration status, a different message and form would display. This is control in setupRegisterForm function. Only non-registered users get to see the register form. Registered user will be prompted to send email to contact@sta.gov.sa to update details.

## Register form

Once user has filled in the form, the submission process the data as such:

 1. It validates the form, nothing will be submitted before user enter everything correctly.
 2. Once it's validated, if it's a new user (based on subscribe form), we match and check if the company has already exist by matching it againts STA companies data (checkCompanyNameExist function).
 3. If the company exists, we will store the CompanyGuid, otherwise, we create the new company and then store the CompanyGuid of the new company.
 4. Once we have the CompanyGuid, we create the new contact with all the submitted data including the CompanyGuid.
 5. Display registration successfully message.

## Arabic version

Arabic version markup is in  *{STA root folder}/ar/index.html*

## Deployment

Deployment is setup using pipelines.