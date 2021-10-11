//import { contentful } from 'contentful';
(function($) {
   
    var client = contentful.createClient({
        space: 'cfexampleapi',
        _accessToken: 'b4c0n73n7fu1',
        get accessToken() {
            return this._accessToken;
        },
        set accessToken(value) {
            this._accessToken = value;
        },
    });

    client.sync({ initial: true }).then((response) => {
        console.log(response.entries);
        console.log(response.assets);
    });
    
    console.log(contentful + "=>" +  "check hihi")

})(jQuery);    