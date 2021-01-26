<script>
  import Bio from "../components/About/Bio.svelte";
  import Audio from "../components/Audio.svelte";
  import Gallery from "../components/Gallery.svelte";
  import { onMount } from "svelte";
  onMount(() => window.scrollTo(0, document.body.scrollHeight));
</script>

<div
  class="container d-flex justify-content-center flex-column align-content-center"
>
  <Bio />
  <!-- <Audio /> -->
  <!-- <Gallery /> -->
  <!-- <button class="btn mt-5" on:click={() => window.scrollTo(0, 0)}> Top </button> -->
</div>

<style>
  /* button {
    width: fit-content;
    justify-content: center;
  } */
  .container {
    align-items: center;
  }
</style>
