<div
  class="contact-form container d-flex py-5 my-5 flex-column justify-content-around align-items-center flex-wrap"
  style="text-align: center;"
>
  <h1 class="display-3 py-4">Say hello</h1>
  <form
    action="https://formspree.io/f/xpzolpwz"
    class="text-left"
    method="POST"
  >
    <div class="form-group">
      <label for="name"> Your name: </label>
      <input type="text" name="name" />
    </div>
    <div class="form-group">
      <label for="_replyto"> Your email: </label>
      <input type="text" name="_replyto" />
    </div>
    <div class="form-group">
      <label for> Your message: </label>

      <textarea name="message" row="10" />
    </div>
    <input type="submit" class="btn" value="Submit" />
    <input type="hidden" name="_next" value="//site.io/thanks.html" />
  </form>
</div>

<style>
  /* input,
textarea:not(.btn) {
  background: rgb(255, 255, 255, 0.5);
  border-radius: 4px;
  border: none;
} */
  textarea {
    width: 300px;
    height: 150px;
  }
  @media only screen and (min-width: 769px) {
    .contact-form {
      max-width: 50vw;
    }
  }
</style>
