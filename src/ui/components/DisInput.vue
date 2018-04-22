<template>
	<div class="DisInput">
		<label>
			<input ref="input"
				v-model="_content"
				:type="type"
				:name="inputName"
				:maxlength="maxlen"
				:placeholder="placeholder"
				:style="{color}"
				:autocomplete="autocomplete"
				:novalidate="novalidate"
				:spellcheck="spellcheck"
				:required="required">

			<div class="DisIndicator">
				<div class="DisIndicator__focus"></div>
				<div class="DisIndicator__length" :style="transformObject"></div>
			</div>
		</label>
	</div>
</template>

<style lang="less" scoped>
	*::selection {
		background: rgba(255, 255, 255, .1);
	}

	.DisInput {
		margin: 15px;

		label {
			width: 100%;
			display: flex;
			flex-direction: column;
		}

		input {
			border: none;
			background: transparent;
			flex: 1;
			outline: none;
			padding: 15px;
			font-size: 1.1rem;
			font-family: 'BlinkMacSystemFont', 'Lucida Grande', 'Segoe UI', Ubuntu, Cantarell, sans-serif;
			position: relative;
			border-bottom: 2px solid rgba(255, 255, 255, .1);

			& + .DisIndicator {
				position: relative;

				.DisIndicator__focus {
					content: '';
					display: block;
					position: absolute;
					background: #2196f3;
					width: 100%;
					height: 2px;
					bottom: 0;
					left: 0;
					transition: transform .5s ease;
					transform: scaleX(0);
				}

				.DisIndicator__length {
					content: '';
					display: block;
					position: absolute;
					background: darken(#2196f3, 20%);
					width: 100%;
					height: 2px;
					bottom: 0;
					left: 0;
					transition: transform .4s, opacity .4s ease;
					opacity: .4;
					transform: scaleX(0);
				}
			}

			&:focus + .DisIndicator {
				.DisIndicator__focus {
					transform: scaleX(1);
				}

				.DisIndicator__length {
					opacity: 1;
				}
			}
		}
	}
</style>

<script>
	export default {
		model: {
			prop: 'content',
			event: 'change'
		},
		props: {
			spellcheck: Boolean,
			autocomplete: Boolean,
			required: Boolean,
			novalidate: Boolean,
			content: String,
			inputName: String,
			type: {
				type: String,
				default: "text"
			},
			maxlen: {
				type: Number,
				default: 100
			},
			color: {
				type: String,
				default: "#f1f2f3"
			},
			placeholder: {
				type: String,
				default: "Type here..."
			}
		},
		computed: {
			_content: {
				get() {
					return this.content;
				},
				set(v) {
					this.$emit('change', v);
				}
			},
			length() {
				return this.content.length;
			},
			transformObject() {
				return {
					transform: `scaleX(${this.length / this.maxlen})`
				};
			}
		}
	};
</script>
