<script>
  import { fade } from "svelte/transition";
  import Form from "../components/Contact/Form.svelte";
</script>

<div class="d-flex mt-5 flex-wrap justify-content-center">
  <Form />
  <img src="images/KR12-min.jpg" class="m-5 order-md-0" alt="">
</div>


<style>
img {
  max-width: 40vw;
  object-fit: cover;
}
@media only screen and (max-width: 768px) {
  img {
    max-width: 100%;
  }
}
</style>
