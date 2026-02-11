import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import store from './store';
import actionDirective from './directives/action';

const app = createApp(App);

app.use(Antd);
app.use(router);
app.use(store);
app.use(actionDirective);

app.mount('#app');
