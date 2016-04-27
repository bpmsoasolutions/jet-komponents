import components from './components';

export const helper = (name, html, defaults) => {
    defaults = (defaults) ? defaults : {};

    class Class {
        constructor(params){
            this.params = params;
            this.ojcomponent = Object.assign({},
                {
                    component: name
                },
                defaults,
                params
            );
            Object.keys(params).map( k => this[k] = params[k] );
        }
    }

    return {
        viewModel: Class,
        template: html
    };
};


export const register = function (ko) {
    Object.keys(components).map( key => {
        var config = Object.assign({},
            {
                component: '',
                template: '',
                defaults: {}
            }, components[key]);

        ko.components.register(
            key,
            helper(
                config.component,
                config.template,
                config.defaults
            )
        );
    });
};