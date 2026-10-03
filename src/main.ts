import { ElDialog } from 'element-plus';
import { createApp } from 'vue';
import 'virtual:uno.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '@/assets/styles/index.scss';
import 'virtual:svg-icons-register';
import i18n from '@/lang/index';
import ElementIcons from '@/plugins/svgicon';
import App from './App.vue';
import directive from './directive';
import plugins from './plugins/index';
import './permission';
import router from './router';
import store from './store';

ElDialog.props.closeOnClickModal.default = false;

const app = createApp(App);

app.use(ElementIcons);
app.use(store);
app.use(router);
app.use(i18n);
app.use(plugins);
directive(app);

app.mount('#app');
