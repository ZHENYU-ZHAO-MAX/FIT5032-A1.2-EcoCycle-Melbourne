<script setup>
defineProps({ resource: { type: Object, required: true } })
</script>

<template>
  <article class="card shadow-sm border-primary h-100 w-100">
    <div class="card-body">
      <h3 class="h5">{{ resource.title }}</h3>
      <p v-if="resource.description" class="mb-2">{{ resource.description }}</p>
      <span class="badge bg-success"><span class="visually-hidden">Type: </span>{{ resource.type }}</span>
    </div>
  </article>
</template>
