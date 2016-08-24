import * as utils from './utils';

let components = {};
// Components with no defaults
let shortcutsComponents = {
    'input': ['ojInputText', 'ojInputPassword', 'ojInputNumber', 'ojInputDateTime',  'ojSlider', 'ojCombobox', 'ojInputSearch', 'ojSwitch'],
    'textarea': ['ojTextArea'],
    'div':['ojDialog', 'ojSelect', 'ojCheckboxset', 'ojRadioSet','ojToolbar', 'ojLedGauge', 'ojDiagram','ojLegend', 'ojNBox', 'ojPictoChart', 'ojButtonset', 'ojDataGrid', 'ojTree',  'ojRowExpander', 'ojPagingControl', 'ojTabs'],
    'ul': ['ojMenu', 'ojListView', 'ojIndexer'],
    'button': ['ojButton'],
    'table': ['ojTable']
};
// Custom components
let customComponents = {
    'ojNavigationList': {
        template: 'div',
        defaults: {
            navigationLevel: 'application',
            edge: 'start',
            optionChange: function() {},
            data: [],
            selection: '',
            item: {
                template: ''
            }
        }
    },
    'ojChart':{
        template: 'div',
        defaults:{
            type: 'line',
            series: [],
            groups: [],
            animationOnDisplay: 'none',
            animationOnDataChange: 'none',
            orientation: 'vertical',
            hoverBehavior: 'dim'
        }
    }
};
utils.generateShortcutsComponents(shortcutsComponents, components);
utils.generateCustomComponents(customComponents, components);

/*
    components:{
        HTML_TAG_OF_THE_COMPONENT: {
            component: NAME_OF_COMPONENT,
            template: HTML_CODE_OF_THE_TEMPLATE,
            defaults: OBJECT_WITH_THE_DEFAULTS_PROPERTIES
        },
        HTML_TAG_OF_THE_COMPONENT2: { ... },

        ...
    }
*/
export default components;
