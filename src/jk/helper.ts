import components from './components';

export const helper = (name, html, defaults) => {
    defaults = (defaults) ? defaults : {};
    return {
        viewModel: koClass(name, defaults),
        template: (html.length > 10) ? html : ojHtml(html)
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

export const koClass = function (name, ojDefaults) {
    var defaultFields = ['click', 'id', 'style', 'css', 'title'];

    return class Class {
        public params
        public ojcomponent

        constructor(params){
            this.params = params;
            this.ojcomponent = Object.assign({},
                {
                    component: name
                },
                ojDefaults,
                params
            );
            defaultFields.map((k) => {
                this[k] = (params[k]) ? params[k] : '';
            });
        }
    }
}

export const ojHtml = (name) => {

    let defaultFields = ['id','title','style', 'css'];

    let child = '';
    if (name !== 'input'){
        child = `<!-- ko with:$parent -->\
        <!-- ko template: { nodes: $componentTemplateNodes } --><!-- /ko -->\
        <!-- /ko -->`;
    }
    var click = '';
    if (name === 'button'){
        click = `click:click,`;
    }

    var attr = '';
    defaultFields.map(function(c, i){
        attr += `\'${c}\':${c}${ (i < defaultFields.length-1) ? ',' : '' } `;
    });

    return `<${name} data-bind="${click} attr: {${attr}}, ojComponent: ojcomponent"> ${child} </${name}>`;
};