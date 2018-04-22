<template>
	<section class="DisPrompt">
		<div class="DisPrompt__container">
			<h3 class="DisPrompt__title">
				{{title}}
			</h3>

			<dis-input :maxlen="50" class="DisPrompt__input" v-model="input"></dis-input>
		</div>

		<footer class="DisPrompt__footer">
			<button class="DisPrompt__button DisButton DisButton--primary" @click="action('primary')" v-ripple>
				{{primary}}
			</button>

			<button class="DisPrompt__button DisButton" @click="action('secondary')" v-ripple>
				{{secondary}}
			</button>
		</footer>
	</section>
</template>

<style lang="less" scoped>
	.DisPrompt {
		display: flex;
		flex-direction: column;
		height: 300px;
		background: #303030;
		font-family: 'BlinkMacSystemFont', 'Lucida Grande', 'Segoe UI', Ubuntu, Cantarell, sans-serif;

		&__container {
			padding: 40px;
			box-sizing: border-box;
		}

		&__title {
			margin: 0;
			padding: 0;
			color: #f1f2f3;
			font-weight: 100;
			font-size: 1.3rem;
			margin-bottom: 40px;
		}

		&__input {
			background: #202020;
			margin: 7px;
			padding: 8px;
			box-shadow: 0 2px 5px 1px rgba(0, 0, 0, .3);
		}

		&__footer {
			margin-top: 15px;
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			background: #252525;
		}
	}

	.DisButton {
		padding: 10px 20px;
		margin: 10px;
		background: transparent;
		border: none;
		outline: none;
		color: #d1d2d3;
		font-weight: 400;
		cursor: pointer;
		transition: all .4s ease;
		box-shadow: 0 2px 5px 1px rgba(0, 0, 0, .3);

		&:hover {
			background: rgba(255, 255, 255, .1);
		}

		&--primary {
			background: #1e88e5;

			&:hover {
				background: darken(#42a5f5, 5%);
			}
		}
	}
</style>

<script>
	import DisInput from "./DisInput.vue";
	import Ripple from "vue-ripple-directive";

	Ripple.color = 'rgba(255, 255, 255, .1)';

	export default {
		data() {
			return {
				input: ''
			};
		},

		components: {
			DisInput
		},

		directives: {
			ripple: Ripple
		},

		props: {
			title: {
				type: String,
				required: true
			},

			primary: {
				type: String,
				default: "OK"
			},

			secondary: {
				type: String,
				default: "CANCEL"
			}
		},

		methods: {
			action(name) {
				this.$emit(name, this.input);
			}
		}
	};
</script>
