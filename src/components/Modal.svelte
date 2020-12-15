<script>
    import {fade} from 'svelte/transition'
    import { createEventDispatcher, onDestroy } from 'svelte';

    const dispatch = createEventDispatcher();
    const close = () => dispatch('close');

    const handle_keydown = e => {
        if (e.key === 'Escape') {
            close();
            return;
        }
    }
    export let imgSrc;
</script>

<style>
  div.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;
  }
  div.backdrop {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(85, 85, 85, 0.7);
  }
  div.content-wrapper {
    z-index: 10;
    max-width: 70vw;
    border-radius: 0.3rem;
    background-color: white;
    overflow: hidden;
    border: 2px solid black;
  }
  .image {
    height: 90vh;
    overflow: auto;
  }
  @media (max-width: 767px) {
    div.content-wrapper {
      max-width: 100vw;
    }
    .image {
        width: 95vw;
        height: auto;
    }
  }
</style>

<!-- svelte-ignore a11y-autofocus -->
<div class="modal" on:keydown={handle_keydown} transition:fade={{duration: 300} } tabindex={0} autofocus>
  <div class="backdrop" on:click={close}/>

  <div class="content-wrapper">
    <slot name="image">
    <img class="image" src={imgSrc} alt="">
    </slot>
  </div>
</div>
<!-- {/if} -->