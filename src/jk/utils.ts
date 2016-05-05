export const camelToDash = (str) =>
    str.replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])/g, (x, chr) => chr.toLowerCase());

export const dashToCamel = (str) =>
    str.replace(/\W+(.)/g, (x, chr) => chr.toUpperCase() );

export const generateShortcutsComponents = (shortcutsComponents, components) => {
    Object.keys(shortcutsComponents).map((templateKey) => {
        shortcutsComponents[templateKey].map((componentKey) => {
            let componentTag = camelToDash(componentKey);
            components[componentTag] = {
                component: componentKey,
                template: templateKey
            };
        });
    });
};

export const generateCustomComponents = (customComponents, components) => {
    Object.keys(customComponents).map((componentKey) => {
        let componentConfig = customComponents[componentKey];
        let componentTag = camelToDash(componentKey);
        components[componentTag] = {
            component: (componentConfig.component) ? componentConfig.component : componentKey,
            template: componentConfig.template,
            defaults: (componentConfig.defaults) ? componentConfig.defaults : {}
        };
    });
};