<template>
<div class="wrapper">
  <form @submit.prevent class="form" enctype="multipart/form-data">
    <section class="section section--1">
      <label for="file" class="label">Select a plain text file</label>
      <input @change="onChangeFile" type="file" name="file" />
    </section>
    <section class="section section--2">
      <label for="interval" class="label">Choose interval</label>
      <input v-model="form.interval" type="range" name="interval" step="1" min="0" max="5000" /><span>{{ form.interval }} ms</span>
    </section>
    <section class="section section--3">
      <button @click="onSubmit" type="submit" class="button" :disabled=isSubmitting>Print</button>
    </section>
  </form>

  <div class="notifications">
    <div v-if="errors.length > 0" class="errors">
      <div v-for="error in errors">{{ error }}</div>
    </div>
    <div v-if="isPrinting" class="progress">Progress {{ printingProgress }}%</div>
  </div>

  <div v-if="textLines.length > 0" class="output">
    <div class="output-inner">
      <span v-for="line in textLines">{{ line }}</span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';

enum PrintStatus {
  Processing = 'processing',
  Complete = 'complete'
}

interface PrintMessage {
  progress: number,
  line: string,
  status: PrintStatus
}

const socketProtocol : string = Date.now().toString()
const socket = new WebSocket(__WSS_PATH__, [socketProtocol]);
const textLines = ref([]);
const errors = ref([]);
const form = reactive({
  interval: 100,
  file: null
});
const printingProgress = ref(null);
const isSubmitting = ref(false);
const isPrinting = computed(() => printingProgress.value && form.interval > 0);

socket.addEventListener('message', (message : MessageEvent) => {
  const { progress, line, status } : PrintMessage = JSON.parse(message.data);
  printingProgress.value = progress;
  textLines.value.push(line);
  if (status === PrintStatus.Complete) {
    printingProgress.value = null
  }
});

function onChangeFile(event : Event) : void {
  const { files } = event.target;
  if (files && files[0]) {
    form.file = files[0];
  }
}

async function onSubmit() : Promise<void> {
  reset();

  if (form.file) {
    isSubmitting.value = true;
    const formData = new FormData();
    for (const key in form) {
      formData.set(key, form[key]);
    }
    formData.set('socketProtocol', socketProtocol);
    const response = await fetch(__API_PATH__, { method: 'POST', body: formData });
    if (!response.ok) {
      const text = await response.text?.();
      addError(text || 'SOMETHING WENT WRONG');
    }
    isSubmitting.value = false;
  } else {
    addError('SELECT A FILE');
  }
}

function addError(message : string) :void {
  errors.value.push(message);
}

function reset() : void {
  textLines.value.length = 0;
  errors.value.length = 0;
}
</script>

<style scoped>
.button {
  border: 1px solid var(--clr-yellow);
  padding: 0.5rem;
  color: var(--clr-yellow);
  background: none;
  cursor: pointer;
}
.button:not[disabled]:hover,
.button:not[disabled]:active {
  background: var(--clr-yellow);
  color: var(--clr-black);
}
.button[disabled] {
  opacity: 0.5;
}

.errors {
  background: var(--clr-yellow);
  color: var(--clr-black);
  padding: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

@media screen and (min-width: 960px) {
  .form {
    flex-direction: row;
  }
}

.label {
  display: inline-block;
  color: var(--clr-yellow);
  padding: 0.5rem 1rem;
}

.notifications {
  min-height: 4rem;
}

.output {
  flex: 1;
  display: flex;
  justify-content: center;
}
.output-inner {
  white-space: pre;
  user-select: none;
}
.output-inner span {
  display: block;
}

.progress {
  padding: 0 1rem;
}

.section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  user-select: none;
}
.section--1 {
  justify-self: start;
}
.section--2 {
  justify-self: center;
}
.section--3 {
  flex: 1;
  padding: 0 1rem;
}

@media screen and (min-width: 960px) {
  .section--3 {
    justify-content: flex-end;
  }
}

.wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>