# jet-komponents
Oracle-jet components used in knockout way. We try to wrap jet components to register as custom elements.



## What is

This is an utility to create the jet components in a modern philosophy that knockout > 3.2 have out of the box. Is the web components inspired idea.



## Why

The jet components right now uses too much verbose way to define, for example a button have to be declared like:

```html
<button data-bind="
    click: $parent.toggleDrawer,
    ojComponent: {
        component:'ojButton',
        label: 'Application Navigation'
    }">
</button>
```

The ```ojComponent: {/*…*/}``` part is fixed for all components in jet and we are trying to create a cleaner way to do that:

```html
<oj-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</oj-button>
```

Our solution are trying to simplify the use of that components.



## What is for

The actual components make a little bit dirty the html of your application, if you have a really big application in jet you feel a little bit lost when you read the html. The idea comes from react, in react the button will be defined like this:

```html
<oj-button
    click="pauseResumeInterval"
    label="Application Navigation">
</oj-button>
```

Saving the distancies, because react use the jsx syntax, that is really comfortable to write components, we want to arrive to a something similar.

```html
<oj-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</oj-button>
```



## Benefits

The main benefits are that your jet components are compact (less code), these increase the legibility of the code.



## Getting started
Install the module with: `bower install jet-komponents`

Add it to your requireJs config:

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

Then to register the components, go to your entry point and run our register function.

```javascript
/* ... */
require(['ojs/ojcore', 'knockout', 'jquery', 'jet-komponents'],
    function(oj, ko, $, jetKomponents) {
        jetKomponents.register(ko);
/* ... */
```

Now you can use the components in this way.

```html
<oj-button params="
    click: pauseResumeInterval,
    label: 'Application Navigation'">
</oj-button>
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



## Documentation
This first version of the library borns to cover our needs, to have a better experience with jet. Right now is a wrapper for at least this components (more components will be added):

```javascript
['ojInputText', 'ojInputPassword', 'ojInputNumber', 'ojInputDateTime',  'ojSlider', 'ojCombobox', 'ojInputSearch', 'ojSwitch', 'ojTextArea', 'ojSelect', 'ojCheckboxset', 'ojRadioSet','ojToolbar', 'ojLedGauge', 'ojDiagram','ojLegend', 'ojNBox', 'ojPictoChart', 'ojButtonset','ojMenu', 'ojListView', 'ojDialog', 'ojButton', 'ojNavigationList', 'ojChart']
```

As you can check, right now we only eliminate ```ojComponent: { component: NAME, /* … */ }``` dependency, so every parameter you pass will be injected inside that, the only field that are not infected are the click field. We are working to provide a better way.

**Remember that you must import the component you want in your requireJs, this is only a wrapper over Jet.**



## Methods

The library exports 2 methods:

- Object **components**:  Contains all basic configuration for the components.
- Function **register(ko)**:  You pass a knockout context and register inside that, the components inside the previous field.

We have internally a function that returns the class for every component, and then register it in the [knockout way](http://knockoutjs.com/documentation/component-overview.html).



## Usage

All components follow the same structure and we wrap it in the same way, all params you pass to the component are extended to the ojComponent. Also the library recognizes the fields id, css, style and title, and it are passed in the root element.

In addittion, you can pass childs, we binded the actual context down to allow you complex nesting of components. Example:

```html
<oj-toolbar>
    <oj-dialog params="
        rootAttributes: { style: 'width: 620px;height: 350px;'},
        title: 'Project configuration',
        id: 'config'">
        <!-- ... -->
          <div class="oj-flex-item oj-sm-6">
          <oj-input params="value: apiUrl"></oj-input>
         </div>
          <!-- ... -->
    </oj-dialog>
</oj-toolbar>
```



## Issues

We try to develop a library as much simple we can, and we create a common system to wrap the jet components. With some components, sometimes instead of add the tags id, css, style to the root of the component params, you need to put in the rootAttributes fields (for example in the oj-dialog). In the future the idea is to have specific templates for every component.



## Examples

**Select** (ojs/ojselect)

```html
<oj-select params="
    multiple: true,
    value: selectedFields,
    options: listOfFields,
    rootAttributes: {
        id: 'multiselect',
        style:'max-width:100%'
    }">
</oj-select>
```

**Button** (ojs/ojbutton)

```html
<oj-button params="
    click: addGraphs,
    label:'Add',
    rootAttributes: {
        style: 'float:right'
    }">
</oj-button>
```

**Chart** (ojs/ojchart)

```html
<oj-chart params="
    series: widget.data,
    groups: $parent.lineGroups,
    rootAttributes:{
        style: 'width:100%;height:350px;'
    }">
</oj-chart>
```

**Navigation List** (ojs/ojnavigationlist)

```html
<oj-navigation-list params="
    optionChange: $parent.navChange,
    item: {template: 'navTemplate'},
    data: $parent.navDataSource,
    selection: $parent.router.stateId(),
    edge: 'top',
    rootAttributes:{
        class:'oj-web-applayout-navbar oj-sm-only-hide oj-web-applayout-max-width oj-navigationlist-item-dividers oj-md-condense oj-md-justify-content-center oj-lg-justify-content-flex-end'
    }">
</oj-navigation-list>
```

**Dialog** (ojs/ojdialog)

```html
<oj-dialog params="rootAttributes: { style: 'width: 620px;height: 350px;'}, title: 'Project configuration', id: 'config'">
    <div class="oj-dialog-body">
      <!-- ... -->
    </div>
    <div class="oj-dialog-footer">
        <oj-button params="click: closeModal, label: 'Close'"></oj-button>
    </div>
</oj-dialog>
```

**List view** (ojs/ojlistview)

```html
<oj-list-view params="
    selectionMode: 'single',
    data: fieldsTable,
    selection: selectionField,
    item: {template: 'list_template'},
    rootAttributes: {
        id: 'listview'
    }">
</oj-list-view>
```

**Input** (ojs/ojinput)

```html
<oj-input-text params="
    value: searchValue,
    style: 'max-width:25em',
    id: 'search-word'">
</oj-input-text>
```

# Release History

Feel free to submit a suggestion or a bug.

## (0.5.0)

- First release we will update soon, stay tuned!
- Components:
  - ojInputText
  - ojInputPassword
  - ojInputNumber
  - ojInputDateTime
  - ojSlider
  - ojCombobox
  - ojInputSearch
  - ojSwitch
  - ojTextArea
  - ojSelect
  - ojCheckboxset
  - ojRadioSet
  - ojToolbar
  - ojLedGauge
  - ojDiagram
  - ojLegend
  - ojNBox
  - ojPictoChart
  - ojButtonset
  - ojMenu
  - ojListView
  - ojDialog
  - ojButton
  - ojNavigationList
  - ojChart

  ​


## License

Licensed under the MIT license. 2016 [bpmsoasolutions.com](http://bpmsoasolutions.com)

