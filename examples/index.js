import Vue from 'vue';
import DisPrompt from '../src/ui/components/DisPrompt.vue';

new Vue({
	el: "#prompt",
	render(h) {
		return h(DisPrompt, {
			props: {
				title: "Please input new project name."
			}
		});
	}
});
