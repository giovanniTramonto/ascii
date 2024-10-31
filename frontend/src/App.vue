<template>
  <form @submit.prevent class="flex flex-col" action="/api" method="post" enctype="multipart/form-data">
    <section>
      <input @change="onChangeFile" type="file" />
      <input v-model="form.interval" type="range" step="1" min="0" max="5000" class="text-black" /> {{ form.interval }} ms
    </section>
    <section>
      <button @click="onSubmit" type="submit" class="button ">Print</button>
    </section>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const form = reactive({
  interval: 0,
  file: null
})


function onChangeFile(event : Event) {
  const { files } = event.target
  if (files && files[0]) {
    form.file = files[0]
  }
}

function onSubmit() {
  console.log(form)
}
</script>
