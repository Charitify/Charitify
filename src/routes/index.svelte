<script>
    import { Swipe, SwipeItem } from "../plugins";
    import { Button, Picture, Input, Progress, ProgressNext, Icon, Form, Rate, Avatar, Divider } from '../components'
</script>

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
</style>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<section class="container">
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

    <Progress value="65"></Progress>
    <br>
    <ProgressNext value="75"></ProgressNext>

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

    <br>

    <h1>The main title</h1>

    <br>

    <p class="text-center" style="padding: 0 10vw">
        A small description that describes the title above and just makes text longer.
    </p>
</section>

<br>
<br>

<Divider/>


<Form on:submit="{(e) => console.log(e)}" name="main-form">
    <br>
    <br>

    <Input name="test1" type="number" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test2" type="text" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test3" type="email" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test4" type="url" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test5" type="search" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test6" type="date" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test7" type="password" list="sum-suggestions"/>

    <br>
    <br>

    <Input name="test8" type="tel" list="sum-suggestions"/>

    <br>
    <br>

    <Button is="success" type="submit">Submit</Button>
</Form>

<h1>Charitify - is the application for helping those in need.</h1>

<br>
<br>

<h2 class="text-success">Typography</h2>

<br>
<br>

<p>Few paragraphs to text fonts</p>
<p>Декілька параграфів для тесту тексту</p>
<p>Несколько параграфов для теста текста</p>

<br>
<br>

<h2 class="text-warning">Interactive elements</h2>

<ul>
    <li>
        <span>
            <Icon size="small" type="heart-filled"/>
            <Icon size="small" type="heart-filled" is="warning"/>
            <Icon size="small" type="heart-filled" is="danger"/>
        </span>
    </li>
    <li>
        <span>
            <Icon type="heart-filled"/>
            <Icon type="heart-filled" is="warning"/>
            <Icon type="heart-filled" is="danger"/>
        </span>
    </li>
    <li>
        <span>
            <Icon size="big" type="heart-filled"/>
            <Icon size="big" type="heart-filled" is="warning"/>
            <Icon size="big" type="heart-filled" is="danger"/>
        </span>
    </li>
</ul>

<br>
<br>

<section style="text-align: center; display: flex; justify-content: space-around">
    <div>
        <br>
        Buttons
        <br>
        <br>
        <Button on:click="{e => console.log(e)}">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" ariaLabel="text">test</Button>
        <br>
        <br>
        With text
        <Button is="success" on:click="{e => console.log(e)}">test</Button>
        and behind.
        <br>
        <br>
        <Button is="warning" on:click="{e => console.log(e)}">Some example of Button</Button>
        <br>
        <br>
        <Button is="danger" on:click="{e => console.log(e)}">Some example of Button</Button>
        <br>
        <br>
    </div>

    <div>
        <br>
        Links as buttons
        <br>
        <br>
        <Button on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        With text
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        and behind.
        <br>
        <br>
        <Button is="warning" on:click="{e => console.log(e)}" href="#">Some example of Button</Button>
        <br>
        <br>
        <Button is="danger" on:click="{e => console.log(e)}" href="#">Some example of Button</Button>
        <br>
        <br>
    </div>
</section>

<br>
<br>

<h2 class="text-danger">Input fields</h2>

<br>
<br>

<section>
    <Input rows={2} name="tex" list="lis"/>

    <br>
    <br>

    <Input name="tex1" list="lis" placeholder="Some placeholder text"/>

    <br>
    <br>

    <Input type="number" name="tex2" list="lis"/>

    <datalist id="lis">
        <option value="1">
        <option value="2">
        <option value="3">
    </datalist>

    <label for="input" class="text-success">label</label>
    <input id="input" type="text" value="text">

    <br>
    <br>

    <a href="." class="text-warning">Some link</a>

    <br>
    <br>

    <button type="button" class="text-info">Button example</button>
</section>

<br>
<br>

<h2 class="text-info">Images</h2>

<br>
<br>

<Picture src="https://placeimg.com/1000/1000/any" alt="sample"/>

<br>
<br>

<h2 class="text-success">Other</h2>

<p>
    <strong>
        Try editing this file (src/routes/index.svelte) to test live reloading.
    </strong>
</p>

<p style="text-align: justify">
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.

    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
    A lot of English text. A lot of English text. A lot of English text. A lot of English text.
</p>
