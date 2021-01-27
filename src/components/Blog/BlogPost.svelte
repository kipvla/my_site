<script>
  import { link } from "svelte-routing";

  export let Title;
  export let ID;
  export let Image;
  export let Body;
  export let Date;
  console.log(Date);

  const parseDate = (date) => {
    console.log(Date);
    return date.toString().split(/-|T|:/);
  };

  const formatDate = (arr) => {
    console.log(arr);
    return `${arr[3]}:${arr[4]}, ${arr[1]}/${arr[2]}/${arr[0]}`;
  };
  let main;
  var url = new URL(window.location.href);
  if (url.pathname === "/blog"){
      console.log("yey")
      console.log(main)
      main = true;
  } else {
      main = false;
  }

</script>

<div class="container">
  <div class="col col-lg-2" />
  <div class="col col-lg-8 blog-post">
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <h2 class="text-capitalize mb-3">{Title}</h2>
    <img
      class="blog-image img-thumbnail"
      src="/{Image}"
      alt=""
    />
    
    <h5 class="mt-4">
      {formatDate(parseDate(Date))}
    </h5>
    <!-- <h5>{data.time}</h5> -->
    <p class="justify-content-center my-4 text-dark" class:text-truncate={main}>{Body}</p>
    {#if main}
    <a href="/blog/{ID}" use:link>Read more</a>
    {:else}
    <a href="/blog" use:link>Back to blogs</a>
{/if}
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
