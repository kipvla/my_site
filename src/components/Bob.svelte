<script>
    import {link} from 'svelte-routing';

    export let title;
    export let body;
    export let image;
</script>


<div class="container">
    <div class="col col-lg-2" />
    <div class="col col-lg-8 blog-post">
        <!-- svelte-ignore a11y-img-redundant-alt -->
        <h2 class="text-capitalize mb-3">{title}</h2>
        <img class="blog-image img-thumbnail" src={image} alt="" />
        <!-- <h5>{data.time}</h5> -->
        <p class="justify-content-center my-4 text-dark">{body}</p>
        <a href="/blog" use:link>Back to blogs</a>
    </div>
    <div class="col col-lg-2" />
    <hr />
</div>

<style>
        .blog-post {
  text-align: center;
  justify-content: center;
  margin: auto;
}
.img-thumbnail {
    max-width: 50%;
}
</style>
