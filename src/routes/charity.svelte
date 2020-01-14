<script>
	import { Swipe, SwipeItem } from '../plugins'
	import {
		Icon,
		Rate,
		Input,
		Footer,
		Avatar,
		Button,
		Divider,
		Picture,
		Progress,
	} from '../components'
</script>

<svelte:head>
	<title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
	h1 {
		text-transform: uppercase;
		text-align: center;
	}

	.top {
		display: flex;
		margin-bottom: calc(var(--screen-padding) * 1.5);
		margin-top: var(--screen-padding);
	}

	.top-pic {
		z-index: 0;
		flex-grow: 1;
		overflow: hidden;
		margin-bottom: 2px;
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-primary);
	}

	.options {
		flex: 0;
		display: flex;
		flex-direction: column;
		margin: calc(var(--screen-padding) * -1 / 2) 0;
		padding: 0 0 0 var(--screen-padding);
	}

	.options li {
		flex: none;
		margin: calc(var(--screen-padding) / 2) 0;
	}

	.rate-section {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: calc(var(--screen-padding) * 1.5) 0;
	}

	.ava-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ava-section span {
		font-size: .7rem;
		padding: 0 var(--screen-padding);
	}

	.ava-section span p {
		font-size: .6rem;
	}

	.ava-section span p,
	.ava-section span h3 {
		max-width: 100%;
		line-height: 1.4;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.title {
		overflow: hidden;
		animation: title-anim 1s forwards ease-in;
	}

	@keyframes title-anim {
		0% {
			max-height: 0;
		}
		99.9% {
			max-height: 100vh;
		}
		100% {
			max-height: none;
		}
	}
</style>

<section class="container">

	<section class="title">
		<br>

		<h1>The main title</h1>

		<br>

		<p class="text-center" style="padding: 0 10vw">
			A small description that describes the title above and just makes text longer.
		</p>

		<br>
	</section>

	<section class="top">
		<div class="top-pic">
			<Swipe>
				<SwipeItem>
					<Picture src="https://placeimg.com/300/300/people" alt="sample"/>
				</SwipeItem>
				<SwipeItem>
					<Picture src="https://placeimg.com/300/300/any" alt="sample"/>
				</SwipeItem>
				<SwipeItem>
					<Picture src="https://placeimg.com/300/300/arch" alt="sample"/>
				</SwipeItem>
				<SwipeItem>
					<Picture src="https://placeimg.com/300/300/nature" alt="sample"/>
				</SwipeItem>
				<SwipeItem>
					<Picture src="https://placeimg.com/300/300/tech" alt="sample"/>
				</SwipeItem>
			</Swipe>
		</div>

		<ul class="options">
			<li>
				<Button is="success" on:click="{e => console.log(e)}">test1</Button>
			</li>
			<li>
				<Button is="success" on:click="{e => console.log(e)}">test12</Button>
			</li>
			<li>
				<Button is="success" on:click="{e => console.log(e)}">test123</Button>
			</li>
			<li>
				<br>
				<Input
						type="number"
						name="num"
						list="sum-suggestions"
						placeholder="Num"
						autoselect
						align="right"
				/>

				<datalist id="sum-suggestions">
					<option value="20">
					<option value="500">
					<option value="1000">
				</datalist>
			</li>
			<li>
				<Button is="warning" on:click="{e => console.log(e)}">Submit</Button>
			</li>
		</ul>
	</section>

	<Progress value="65" size="big"></Progress>

	<section class="rate-section">
		<div class="ava-section">
			<Avatar src="https://placeimg.com/300/300/people" alt="avatar"/>

			<span>
                <h3>Tina Kandelaki</h3>
                <p>ORG charity charitify</p>
            </span>
		</div>

		<Rate/>
	</section>
</section>

<br>
<br>
<br>

<Footer/>
