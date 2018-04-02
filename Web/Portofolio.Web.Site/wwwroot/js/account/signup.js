(function($, document,validator){
    
    function setupValidation(){
        $("#signup-form")
            .validate({
                rules:{
                    username:{ 
                        required:true, 
                        minlength:3, 
                        maxlength:40
                    },
                    password:{
                        required:true, 
                        minlength:9,
                        maxlength:20, 
                        patt:/(?=.{9,20})(?=.*?[^\w\s])(?=.*?[0-9])(?=.*?[A-Z]).*?[a-z].*/
                    }
                },
                messages:{
                    username:{
                        required:"please enter a username",
                        minlength:"username is at least 3 characters long",
                        maxlength:"username cannot be more than 40 characters long"
                    },
                    password:{
                        required:"please enter a password",
                        minlength:"password is at least 9 characters long",
                        maxlength:"password cannot be more than 20 characters long",
                        patt: "password must be: between 9 and 20 characters, must contain at least one of each of upper and lower case, numeric, symbols characters"
                    }
                },
                errorElement: "em",
                errorPlacement: function ( error, element ) {
                    // Add the `help-block` class to the error element
                    error.addClass("help-block");

                    if (element.prop( "type" ) === "checkbox") {
                        error.insertAfter(element.parent("label"));
                    } else {
                        error.insertAfter(element);
                    }
                },
                highlight: function (element, errorClass, validClass) {
                    $(element)
                    .parents(".form-group")
                    .addClass("has-error")
                    .removeClass("has-success");
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element)
                    .parents(".form-group")
                    .addClass("has-success")
                    .removeClass("has-error");
                }
            });
    }
    
    $(document).ready(setupValidation);
})(jQuery,document, jQuery.validate);