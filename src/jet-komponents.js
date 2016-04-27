import {helper, register} from './jk/helper';
import components from './jk/components';
import * as utils from './jk/utils';

// Object Contructor
var jetKomponents = {};

// Properties
jetKomponents.VERSION = '0.0.1';

// Methods
jetKomponents.helper = helper;
jetKomponents.register = register;
jetKomponents.components = components;
jetKomponents.utils = utils;

export default jetKomponents;