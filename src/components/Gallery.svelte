<script>
    import { fade, fly } from "svelte/transition";
    import Modal from "./Modal.svelte";
    import images from "../images.js";
    let showModal = false;
    let defineImage = (image) => {
      let imgSrc = image;
    };
    const allImages = [...images];
    let imageUrl = '';
    let bob = '';
  </script>

  <style>
      .card {
          box-shadow: 2px 4px 10px solid black;
      }
  </style>
  
  {#if showModal}
    <Modal on:close={() => {
        showModal = false;
    }} imgSrc={imageUrl}>
      <slot name="image" />
    </Modal>
  {/if}
  
  <div class="container content">
    <div class="row align-items-center content">
      {#each allImages as image}
        <div class="col-md-6">
          <div class="shadow card bg-dark text-white bg-white" on:click={() => { showModal = true; imageUrl = image.url}}>
            <img src={image.url} alt={image.alt} class="card-img" />
            <div class="card-img-overlay">
              <p class="card-text" />
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

