<script>
	import { Swipe, SwipeItem } from '../plugins'
	import { TitleSubTitle, AvatarAndName, Carousel, DonatingGroup } from '../layouts'
	import { Rate, Progress, Br } from '../components'
</script>

<svelte:head>
	<title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
	.top {
		display: flex;
		margin-bottom: calc(var(--screen-padding) * 1.5);
		margin-top: var(--screen-padding);
	}

	.pics-wrap {
		z-index: 0;
		flex-grow: 1;
		display: flex;
		overflow: hidden;
		margin-bottom: 2px;
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-primary);
	}

	.rate-section {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 12px 0;
	}

	.title-wrap {
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

	<section class="title-wrap">
		<br>
		<TitleSubTitle/>
		<br>
	</section>

	<section class="top">
		<div class="pics-wrap">
			<Carousel/>
		</div>

		<DonatingGroup/>
	</section>

	<Progress value="65" size="big"></Progress>

	<section class="rate-section">
		<AvatarAndName
				src="https://placeimg.com/300/300/people"
				title="Tina Kandelaki"
				subTitle="ORG charity charitify"
		/>

		<Rate/>
	</section>
</section>

<Br amount="3"/>
