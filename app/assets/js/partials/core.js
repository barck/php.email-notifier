/*
 * [techcode email notifier]
 * author: Artem Krivoshchekov [zorg1995@yandex.ru]
 * all rights reserved
 * 07.08.2017
 */


(function ($) {
    var options;

    function isEmpty(value) {
        return typeof value === 'string' && !value.trim() || typeof value === 'undefined' || value === null;
    }

    var methods = {
        init: function (options) {
            // check is already init
            var init = this.data('tcEmailNotifier');

            if (init) {
                return this;
            } else {
                this.data('tcEmailNotifier', true);
            }

            // init settings
            this.options = $.extend({
                'containerId': '',
                'submitButtonId': '',
                'backendUrl' : '',
                'isModal' : false
            }, options);

            // init listeners
            this.tcEmailNotifier('initListeners');
        },

        initListeners: function () {
            // init needed fields
            this.options.context = this.tcEmailNotifier;
            this.options.container = '#' + this.options.containerId;
            this.options.$container = $(this.options.container);
            this.options.$form = $(this.options.$container).find('form');
            this.options.$btnSubmit = $(this.options.$container).find('#' + this.options.submitButtonId);

            // placing open-modal listener
            if(this.options.isModal) {
                this.attr('data-toggle', 'modal');
                this.attr('data-target', this.options.container);
            }

            // tel mask
            $(this.options.$form).find('input[type=tel]').inputmask("+7 (999) 999-99-99");

            // email mask
            $(this.options.$form).find('input[type=email]').inputmask("email");

            // date and time mask

            //todo: uncomment for datetimepicker
            /*
            $(this.options.$form).find('input[id=datetime]').datetimepicker({
                locale: 'ru'
            });*/

            //extras user data
            $(this.options.$form).find('input[id=useragent]').val(isEmpty(navigator.userAgent) ? "empty" : navigator.userAgent);
            $(this.options.$form).find('input[id=referrer]').val(isEmpty(document.referrer) ? "empty" : document.referrer);
            $(this.options.$form).find('input[id=timezone]').val(isEmpty(moment.tz.guess()) ? "empty" : moment.tz.guess());
            $(this.options.$form).find('input[id=localtime]').val(isEmpty(moment().toISOString()) ? "empty" : moment().toISOString());

            // placing modal-submit event button
            $(this.options.$btnSubmit).on('click', {options: this.options}, function (e) {
                // remove all error messages from form
                e.data.options.context('clearErrors', {options: e.data.options});

                // validate all input data
                var error = e.data.options.context('validateData', {options: e.data.options});

                // if any errors - show it on form
                // else - submit form to backend
                if(error.length > 0) {
                    e.data.options.context('showErrors', {options: e.data.options, error : error});
                } else {
                    // send data to backend through ajax request
                    e.data.options.context('submitData', {data: e.data.options.$form.serializeArray(), options: e.data.options});
                    // e.data.form.submit();
                }
            });
        },

        closeModal : function (e) {
            setTimeout(function() {
                $(e).modal('toggle');
            }, 500);
        },

        notify: function (data) {
            console.log(data);
            var message = data.error;

            if(data.status) {
                alertify.message(message);
                // todo: remove
                $.fancybox.close();
            } else {
                alertify.error(message);
            }
        },

        submitData : function (e) {
            var form_data = new FormData();
            var file_data = (e.options.$form).find("input:file").prop('files')[0];

            $.each(e.data, function (field, value) {
                form_data.append(value.name, value.value);
            });

            form_data.append('file', file_data);

            $.ajax({
                dataType: "json",
                cache: false,
                contentType: false,
                processData: false,
                type: "POST",

                data: form_data,
                url: e.options.backendUrl
            }).done(function (data) {
                e.options.context('notify', data);
                if(e.options.isModal === true) {
                    e.options.context('closeModal', e.options.$container);
                }

            }).fail(function (data) {
                e.options.context('notify', data);
                if(e.options.isModal === true) {
                    e.options.context('closeModal', e.options.$container);
                }
            });
        },

        showErrors : function (e) {
            $.each(e.error, function (index, error) {
                var $field = e.options.$form.find('#' + error.id);
                if($field.attr('type') === "checkbox") {
                    $field.parent().parent().addClass('has-error');
                    $field.parent().parent().find('.help-block').text(error.error);
                } else {
                    $field.parent().addClass('has-error');
                    $field.parent().find('.help-block').text(error.error);
                }
            });
        },

        clearErrors : function (e) {
            var form = e.options.$form;

            // required fields
            $.each($(form).find('.required'), function (index, field) {
                $field = $(field);

                if($field.attr('type') === "checkbox") {
                    $field.parent().parent().removeClass('has-error');
                    $field.parent().parent().find('.help-block').text('');
                } else {
                    $field.parent().removeClass('has-error');
                    $field.parent().find('.help-block').text('');
                }
            });
        },

        validateData: function (e) {

            var form = e.options.$form;
            var error = [];

            // check for required
            $.each($(form).find('.required'), function (index, field) {
                $field = $(field);
                switch (field.type) {
                    case 'text':
                    case 'tel':
                    case 'email':
                    case 'date':
                    case 'time':
                    case 'textarea':
                        if(isEmpty($field.val())) {
                            error.push({id:field.id, error:"поле не может быть пустым"});
                        }
                        break;
                    case 'checkbox':
                        if($field.prop('checked') === false) {
                            error.push({id:field.id, error:"необходимо принять условия"});
                        }
                        break;
                }
            });

            // todo: check for tel and email formats
            // $.each($(form).find('input[type=tel],input[type=email]'), function (index, field) {
            // });

            return error;
        }
    };

    $.fn.tcEmailNotifier = function (method) {
        // логика вызова метода
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод с именем ' + method + ' не существует для jQuery.tcEmailNotifier');
        }
    };

})(jQuery);