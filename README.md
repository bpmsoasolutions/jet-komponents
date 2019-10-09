# jet-komponents
The current implementation of Oracle JET components require some verbose declarations that can clutter the html of your application. If you have a really big application created with Jet, you might feel a little bit lost when you read the different pages.

Let us see an example for the declaration of a button component:

```html
<button data-bind="
    click: $parent.toggleDrawer,
    ojComponent: {
        component:'ojButton',
        label: 'Application Navigation'
    }">
</button>
```

Now, the ```ojComponent: {/*…*/}``` statement is always the same, regardless of which component we are referring to. Wouldn't it be easier to just declare it as follows?

```html
<ojk-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</ojk-button>
```

As you can see from the example above, the code looks cleaner and more readable: a quick scan through the HTML would already tell you which Jet components you are using. With this idea in mind, we decided to do something about it.

### What is jet-komponents?

A utility to create JET components following the way that Knockout (> 3.2) provides out of the box, inspired in the concept of web components and their use in React - see example below:

```html
<ojk-button
    click="pauseResumeInterval"
    label="Application Navigation">
</ojk-button>
```

React uses JSX which makes it really easy (and readable) to write components, as you can see from the example above. We wanted to have a similar declaration - within the possibilities - which is the reason we created our library:

```html
<ojk-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</ojk-button>
```

By using the utility components declared in a more compact fashion and with less code,increasing the code readability.



## Getting started

First you need to get the utility, so install the jet-komponents module with:

​     `bower install jet-komponents`

Then, add it to your requireJs config as follows:

```javascript
/* ... */
requirejs.config({
    paths: {
        /* ... */
        'jet-komponents': 'libs/jet-komponents/dist/jet-komponents',
        /* ... */
    },
/* ... */
```

Afterwards, go to your entry point and execute the register function as illustrated below:

```javascript
/* ... */
require(['ojs/ojcore', 'knockout', 'jquery', 'jet-komponents'],
    function(oj, ko, $, jetKomponents) {
        jetKomponents.register(ko);
/* ... */
```

That's it! Now you can start declaring components in this way:

```html
<ojk-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</ojk-button>
```

Instead of that:

```html
<button data-bind="
    click: $parent.toggleDrawer,
    ojComponent: {
        component:'ojButton',
        label: 'Application Navigation'
    }">
</button>
```

#### Additional notes for the jet generator
If you use the jet generator, please add these lines to ```scripts/grunt/config/bowercopy.js```, then run ```grunt build``` to copy jet-komponents to the libs folder.

```javascript
module.exports = function(grunt)
{
  return {

    /* ... */
    thirdParty:
    {

      /* ... */
      files:
      {

        /* ... */
        "jet-komponents/jet-komponents.js": "jet-komponents/dist/jet-komponents.js",
        "jet-komponents/jet-komponents.min.js": "jet-komponents/dist/jet-komponents.min.js"
      }
    }
  };
};
```


## Implementation details
This initial version of the utility covers the following components (more to come later):

```javascript
['ojInputText', 'ojInputPassword', 'ojInputNumber', 'ojInputDateTime',  'ojSlider', 'ojCombobox', 'ojInputSearch', 'ojSwitch', 'ojTextArea', 'ojSelect', 'ojCheckboxset', 'ojRadioSet','ojToolbar', 'ojLedGauge', 'ojDiagram','ojLegend', 'ojNBox', 'ojPictoChart', 'ojButtonset','ojMenu', 'ojListView', 'ojDialog', 'ojButton', 'ojNavigationList', 'ojChart']
```



Note that every parameter passed to the component will be injected inside the ```ojComponent: { component: NAME, /* … */ }``` declaration, with the exception of the ```click``` attribute which is left untouched. Future versions will try to improve this.

**Remember to import the component you want in your requireJs, as this is only a wrapper over Jet.**



## Methods

The library exports 2 methods:

- Object **components**:  Contains all basic configuration for the components.
- Function **register(ko)**:  You pass a knockout context and register inside that, the components inside the previous field.

We have internally a function that returns the class for every component, and then register it in the [knockout way](http://knockoutjs.com/documentation/component-overview.html).



## Usage

All components follow the same structure and we wrap it in the same way, all params you pass to the component are extended to the ojComponent. Also the library recognizes the fields id, css, style and title, and it are passed in the root element.

Components can be nested as well just by adding them as children of parent component. Example:

```html
<ojk-toolbar>
    <ojk-dialog params="
        rootAttributes: { style: 'width: 620px;height: 350px;'},
        title: 'Project configuration',
        id: 'config'">
        <!-- ... -->
            <div class="oj-flex-item oj-sm-6">
                <ojk-input params="value: apiUrl"></ojk-input>
            </div>
        <!-- ... -->
    </ojk-dialog>
</ojk-toolbar>
```



## Issues

We have tried to make the usage as simple as we can and to create a homogeneous syntax to wrap jet components. There are some components however in which this is is not possible, such as **oj-dialog**. In these, you have to specify *tag ids*, *css*, *style* in the `rootAttributes` instead of the component parameters. In future releases the idea is to have specific templates for every component. See the list of examples below:

**Select** (ojs/ojselect)

```html
<ojk-select params="
    multiple: true,
    value: selectedFields,
    options: listOfFields,
    rootAttributes: {
        id: 'multiselect',
        style:'max-width:100%'
    }">
</ojk-select>
```

**Button** (ojs/ojbutton)

```html
<ojk-button params="
    click: addGraphs,
    label:'Add',
    rootAttributes: {
        style: 'float:right'
    }">
</ojk-button>
```

**Chart** (ojs/ojchart)

```html
<ojk-chart params="
    series: widget.data,
    groups: $parent.lineGroups,
    rootAttributes:{
        style: 'width:100%;height:350px;'
    }">
</ojk-chart>
```

**Navigation List** (ojs/ojnavigationlist)

```html
<ojk-navigation-list params="
    optionChange: $parent.navChange,
    item: {template: 'navTemplate'},
    data: $parent.navDataSource,
    selection: $parent.router.stateId(),
    edge: 'top',
    rootAttributes:{
        class:'oj-web-applayout-navbar oj-sm-only-hide oj-web-applayout-max-width oj-navigationlist-item-dividers oj-md-condense oj-md-justify-content-center oj-lg-justify-content-flex-end'
    }">
</ojk-navigation-list>
```

**Dialog** (ojs/ojdialog)

```html
<ojk-dialog params="rootAttributes: { style: 'width: 620px;height: 350px;'}, title: 'Project configuration', id: 'config'">
    <div class="oj-dialog-body">
      <!-- ... -->
    </div>
    <div class="oj-dialog-footer">
        <ojk-button params="click: closeModal, label: 'Close'"></ojk-button>
    </div>
</ojk-dialog>
```

**List view** (ojs/ojlistview)

```html
<ojk-list-view params="
    selectionMode: 'single',
    data: fieldsTable,
    selection: selectionField,
    item: {template: 'list_template'},
    rootAttributes: {
        id: 'listview'
    }">
</ojk-list-view>
```

**Input** (ojs/ojinput)

```html
<ojk-input-text params="
    value: searchValue,
    style: 'max-width:25em',
    id: 'search-word'">
</ojk-input-text>
```


## Release History

Feel free to submit suggestions or bug reports.

### (0.5.6)
- Fixed ojRadioset, now you can pass as a parameter 'aria-labelledby'

### (0.5.5)
- Added ojTable, ojIndexer, ojDataGrid, ojTree, ojRowExpander, ojPagingControl, ojTabs

### (0.5.2) [Announcement!](http://www.bpmsoasolutions.com/es/blog/item/40-announcing-jet-komponents-0-5-0.html)

- Now the prefixes by default are "ojk-" (Introduced in v0.5.2)
- Compatible now with all module systems (Introduced in v0.5.1)
- First release we will update soon, stay tuned!
- Added the basics components

## Components Included

  - ojInputText         -> `<ojk-input-text></ ... >`
  - ojInputPassword     -> `<ojk-input-password></ ... >`
  - ojInputNumber       -> `<ojk-input-number></ ... >`
  - ojInputDateTime     -> `<ojk-input-date-time></ ... >`
  - ojSlider            -> `<ojk-slider></ ... >`
  - ojCombobox          -> `<ojk-combobox></ ... >`
  - ojInputSearch       -> `<ojk-input-search></ ... >`
  - ojSwitch            -> `<ojk-switch></ ... >`
  - ojTextArea          -> `<ojk-text-area></ ... >`
  - ojSelect            -> `<ojk-select></ ... >`
  - ojCheckboxset       -> `<ojk-checkbox-set></ ... >`
  - ojRadioset          -> `<ojk-radioset></ ... >`
  - ojToolbar           -> `<ojk-toolbar></ ... >`
  - ojLedGauge          -> `<ojk-led-gauge></ ... >`
  - ojDiagram           -> `<ojk-diagram></ ... >`
  - ojLegend            -> `<ojk-legend></ ... >`
  - ojNBox              -> `<ojk-n-box></ ... >`
  - ojPictoChart        -> `<ojk-picto-chart></ ... >`
  - ojButtonset         -> `<ojk-buttonset></ ... >`
  - ojMenu              -> `<ojk-menu></ ... >`
  - ojListView          -> `<ojk-list-view></ ... >`
  - ojDialog            -> `<ojk-dialog></ ... >`
  - ojButton            -> `<ojk-button></ ... >`
  - ojNavigationList    -> `<ojk-navigation-list></ ... >`
  - ojChart             -> `<ojk-chart></ ... >`
  - ojTable             -> `<ojk-table></ ... >`
  - ojIndexer           -> `<ojk-indexer></ ... >`
  - ojDataGrid          -> `<ojk-data-grid></ ... >`
  - ojTree              -> `<ojk-tree></ ... >`
  - ojRowExpander       -> `<ojk-row-expander></ ... >`
  - ojPagingControl     -> `<ojk-paging-control></ ... >`
  - ojTabs              -> `<ojk-tabs></ ... >`

  ​
## Examples

- TODO app (ES6): [https://github.com/bpmsoasolutions/oracle-jet-todo-app](https://github.com/bpmsoasolutions/oracle-jet-todo-app)
- Base Jet project from official generator with jet-komponents: [https://github.com/bpmsoasolutions/jet-komponents-base-project](https://github.com/bpmsoasolutions/jet-komponents-base-project)

## License

Licensed under the MIT license. 2016 [bpmsoasolutions.com](http://bpmsoasolutions.com)

