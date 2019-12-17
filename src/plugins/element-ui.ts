import Vue from "vue";
import { Button, Select, Option, Form, FormItem, Icon, Divider, Tree, Tabs, Alert, Dialog, Input, Menu, MenuItem, Submenu, Message, TabPane } from "element-ui";

import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
locale.use(lang);

Vue.use(Button)
  .use(Select)
  .use(Option)
  .use(Form)
  .use(FormItem)
  .use(Icon)
  .use(Divider)
  .use(Tree)
  .use(Alert)
  .use(Dialog)
  .use(Input)
  .use(Menu)
  .use(MenuItem)
  .use(Submenu)
  .use(Tabs)
  .use(TabPane);

Vue.prototype.$alert = Alert;
Vue.prototype.$message = Message;
