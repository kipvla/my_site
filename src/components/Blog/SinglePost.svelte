<script>
  import BlogPost from "./BlogPost.svelte";
  import Post1 from './Posts/Post1.svelte'
  var url = window.location.href;
  var id = url.substring(url.lastIndexOf("/") + 1);
  const fetchBlogs = fetch(`/api/blogposts/${id}`)
    .then((data) => {
      console.log("succ", data);
      return data.json();
    })
    .catch((data) => {
      console.log("error", data);
      return data;
    });
</script>
<div class="content">
  <Post1/>
</div>


<!-- {#await fetchBlogs}
  <div class="container d-flex justify-content-center mt-5">
    <p>...writing post</p>
  </div>
{:then data}
  <div class="content">
    <div class="container">
      <BlogPost {...data.post} />
    </div>
  </div>
{:catch error}
  <p>An error occurred! {`${error}`}</p>
{/await} -->

<style>
  .content {
    padding-top: 90px;
  }
</style>
