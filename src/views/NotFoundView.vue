<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="text-center py-5">
    <h1 id="page-heading" tabindex="-1">Page not found</h1>
    <p>Sorry, we couldn't find that page.</p>
    <RouterLink class="btn btn-eco" to="/">Back to home</RouterLink>
  </div>
</template>
