<script>
  import Bio from "../components/About/Bio.svelte";
  import Audio from "../components/Audio.svelte";
  import Gallery from "../components/Gallery.svelte";
  import { onMount } from "svelte";
  onMount(() => window.scrollTo(0,document.body.scrollHeight));
</script>

<Bio />
<Audio />
<Gallery />
<div class="container d-flex justify-content-center">
  <button class="btn mt-5" on:click={ () => window.scrollTo(0,0) }>
    Top
  </button>
</div>
