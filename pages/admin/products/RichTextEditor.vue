<template>
  <div ref="rootRef" class="editor-shell overflow-hidden rounded-[22px] border border-base-300 bg-base-100 shadow-sm">
    <div class="editor-toolbar flex flex-wrap items-center gap-3 border-b border-base-300 bg-base-200/50 px-3 py-3">
      <div class="toolbar-group">
        <button type="button" class="toolbar-button toolbar-button-wide" title="正文" aria-label="正文" @mousedown.prevent @click="editor?.chain().focus().setParagraph().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4 5.5a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.5Zm0 4a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 9.5Zm0 4a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 4 13.5Z" fill="currentColor"/></svg>
          <span>正文</span>
        </button>
        <button
          type="button"
          class="toolbar-button toolbar-button-wide"
          :class="editor?.isActive('heading', { level: 2 }) ? 'toolbar-button-active' : ''"
          title="标题"
          aria-label="标题"
          @mousedown.prevent
          @click="toggleHeading(2)"
        >
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4.75 4a.75.75 0 0 1 .75.75v4.5h9V4.75a.75.75 0 0 1 1.5 0v10.5a.75.75 0 0 1-1.5 0v-4.5h-9v4.5a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 4.75 4Z" fill="currentColor"/></svg>
          <span>标题</span>
        </button>
        <button
          type="button"
          class="toolbar-button toolbar-button-wide"
          :class="editor?.isActive('heading', { level: 3 }) ? 'toolbar-button-active' : ''"
          title="小标题"
          aria-label="小标题"
          @mousedown.prevent
          @click="toggleHeading(3)"
        >
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4.75 4a.75.75 0 0 1 .75.75v4.5h5V4.75a.75.75 0 0 1 1.5 0v10.5a.75.75 0 0 1-1.5 0v-4.5h-5v4.5a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 4.75 4Zm10 2.5a.75.75 0 0 0 0 1.5h.75v4h-.75a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5h-.75V8H17a.75.75 0 0 0 0-1.5h-2.25Z" fill="currentColor"/></svg>
          <span>小标题</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button toolbar-button-icon" :class="editor?.isActive('bold') ? 'toolbar-button-active' : ''" title="加粗" aria-label="加粗" @mousedown.prevent @click="editor?.chain().focus().toggleBold().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M6.25 4A.75.75 0 0 0 5.5 4.75v10.5a.75.75 0 0 0 .75.75h4.375c2.141 0 3.875-1.516 3.875-3.387 0-1.274-.805-2.385-1.996-2.97A3.192 3.192 0 0 0 14 7.125C14 5.399 12.438 4 10.5 4H6.25Zm1.25 4.875V5.5h3c1.152 0 2 .73 2 1.625s-.848 1.75-2 1.75h-3Zm0 1.5h3.125c1.282 0 2.25.93 2.25 2.113 0 1.104-.968 2.012-2.25 2.012H7.5v-4.125Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" :class="editor?.isActive('italic') ? 'toolbar-button-active' : ''" title="斜体" aria-label="斜体" @mousedown.prevent @click="editor?.chain().focus().toggleItalic().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M9 4.75A.75.75 0 0 1 9.75 4h5.5a.75.75 0 0 1 0 1.5h-2.03l-2.44 9h1.97a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5h2.03l2.44-9H9.75A.75.75 0 0 1 9 4.75Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" :class="editor?.isActive('blockquote') ? 'toolbar-button-active' : ''" title="引用" aria-label="引用" @mousedown.prevent @click="editor?.chain().focus().toggleBlockquote().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M5.5 7A2.5 2.5 0 0 0 3 9.5V13a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-2A2 2 0 0 0 6.5 9h-1A1 1 0 0 1 6.5 8h1A.5.5 0 0 0 8 7.5v-1a.5.5 0 0 0-.5-.5h-2Zm8 0A2.5 2.5 0 0 0 11 9.5V13a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-2A2 2 0 0 0 14.5 9h-1A1 1 0 0 1 14.5 8h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-2Z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <div class="relative">
          <button
            type="button"
            title="文字颜色"
            class="toolbar-button toolbar-button-wide"
            :class="isTextColorActive || openPanel === 'text' ? 'toolbar-button-active' : ''"
            @mousedown.prevent
            @click.stop="togglePanel('text')"
          >
            <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M9.169 4.63a.75.75 0 0 1 1.662 0l3.75 9.5a.75.75 0 0 1-1.395.55l-.815-2.065H7.629l-.815 2.065a.75.75 0 1 1-1.395-.55l3.75-9.5ZM8.22 11.115h3.56L10 6.598 8.22 11.115Zm7.03 4.135a.75.75 0 0 1-.75.75H5.5a.75.75 0 0 1 0-1.5h9a.75.75 0 0 1 .75.75Z" fill="currentColor"/></svg>
            <!-- <span>字色</span> -->
          </button>
          <div
            v-if="openPanel === 'text'"
            class="panel-popover left-0 z-[20] mt-2 w-72 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
            @mousedown.prevent
            @click.stop
          >
            <div class="panel-header">
              <div class="panel-title">文字颜色</div>
              <button type="button" class="btn btn-ghost btn-xs" @mousedown.prevent @click="unsetTextColor">清除</button>
            </div>
            <div class="panel-grid panel-grid-colors">
              <button
                v-for="color in textColors"
                :key="`text-${color.value}`"
                type="button"
                class="color-swatch-button"
                :class="isTextColorSelected(color.value) ? 'color-swatch-active' : ''"
                :style="{ '--swatch-color': color.value }"
                title="设置文字颜色"
                @mousedown.prevent
                @click="setTextColor(color.value)"
              >
                <span class="color-swatch"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <div class="relative">
          <button
            type="button"
            title="文字高亮"
            class="toolbar-button toolbar-button-wide"
            :class="editor?.isActive('highlight') || openPanel === 'highlight' ? 'toolbar-button-active' : ''"
            @mousedown.prevent
            @click.stop="togglePanel('highlight')"
          >
            <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M13.82 3.72a1.75 1.75 0 0 1 2.475 0l.0 0 .985.985a1.75 1.75 0 0 1 0 2.475l-7.99 7.99a2.25 2.25 0 0 1-1.02.574l-2.565.641a.75.75 0 0 1-.91-.91l.641-2.565a2.25 2.25 0 0 1 .574-1.02l7.99-7.99Zm1.414 1.06a.25.25 0 0 0-.354 0l-.817.818 1.339 1.338.817-.817a.25.25 0 0 0 0-.353l-.985-.986ZM13.34 6.66l-6.27 6.27a.75.75 0 0 0-.191.34l-.33 1.32 1.32-.33a.75.75 0 0 0 .34-.191l6.27-6.27-1.339-1.338ZM4 16.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Z" fill="currentColor"/></svg>
            <!-- <span>高亮</span> -->
          </button>
          <div
            v-if="openPanel === 'highlight'"
            class="panel-popover left-0 z-[20] mt-2 w-64 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
            @mousedown.prevent
            @click.stop
          >
            <div class="panel-header">
              <div class="panel-title">高亮颜色</div>
              <button type="button" class="btn btn-ghost btn-xs" @mousedown.prevent @click="unsetHighlightColor">清除</button>
            </div>
            <div class="panel-grid panel-grid-colors">
              <button
                v-for="color in highlightColors"
                :key="`highlight-${color.value}`"
                type="button"
                class="color-swatch-button"
                :class="editor?.isActive('highlight', { color: color.value }) ? 'color-swatch-active' : ''"
                :style="{ '--swatch-color': color.value }"
                title="设置高亮颜色"
                @mousedown.prevent
                @click="setHighlightColor(color.value)"
              >
                <span class="color-swatch color-swatch-highlight"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button toolbar-button-icon" :class="editor?.isActive('bulletList') ? 'toolbar-button-active' : ''" title="无序列表" aria-label="无序列表" @mousedown.prevent @click="editor?.chain().focus().toggleBulletList().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M5 5.5A1.25 1.25 0 1 1 2.5 5.5 1.25 1.25 0 0 1 5 5.5Zm2.25-.75a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm-2.25 4.75A1.25 1.25 0 1 1 2.5 9.5 1.25 1.25 0 0 1 5 9.5Zm2.25-.75a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9ZM3.75 13a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm3.5.75a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" :class="editor?.isActive('orderedList') ? 'toolbar-button-active' : ''" title="有序列表" aria-label="有序列表" @mousedown.prevent @click="editor?.chain().focus().toggleOrderedList().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M3.78 4.72a.75.75 0 0 1 1.06 0l.44.44.44-.44a.75.75 0 1 1 1.06 1.06l-.44.44.44.44a.75.75 0 1 1-1.06 1.06l-.44-.44-.44.44a.75.75 0 1 1-1.06-1.06l.44-.44-.44-.44a.75.75 0 0 1 0-1.06Zm4.47.03a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5h-8Zm-4.18 4a.75.75 0 0 0-.97 1.15l.77.65-.77.65a.75.75 0 1 0 .97 1.15l1.45-1.22a.75.75 0 0 0 0-1.15l-1.45-1.23Zm4.18.0a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5h-8Zm-4.66 4.06a.75.75 0 0 0 .38 1.4h1.61l-1.82 1.42a.75.75 0 0 0 .46 1.34h2.53a.75.75 0 0 0 0-1.5H5.95l1.82-1.42a.75.75 0 0 0-.46-1.34H4.34a.75.75 0 0 0-.75.75Zm4.66-.06a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5h-8Z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <div class="relative">
          <button
            type="button"
            title="超链接"
            class="toolbar-button toolbar-button-wide"
            :class="editor?.isActive('link') || openPanel === 'link' ? 'toolbar-button-active' : ''"
            @mousedown.prevent
            @click.stop="toggleLinkPanel"
          >
            <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M11.53 5.47a3.75 3.75 0 0 1 5.303 5.303l-2.121 2.121a3.75 3.75 0 0 1-5.304 0 .75.75 0 1 1 1.06-1.06 2.25 2.25 0 0 0 3.183 0l2.122-2.122a2.25 2.25 0 0 0-3.182-3.182L10.47 8.66a.75.75 0 1 1-1.06-1.06l2.121-2.122Zm-6.243 1.636a3.75 3.75 0 0 1 5.304 0 .75.75 0 1 1-1.061 1.06 2.25 2.25 0 0 0-3.182 0L4.227 10.35a2.25 2.25 0 0 0 3.182 3.182l2.122-2.122a.75.75 0 0 1 1.06 1.061L8.47 14.591a3.75 3.75 0 1 1-5.303-5.303l2.121-2.182Z" fill="currentColor"/></svg>
            <!-- <span>链接</span> -->
          </button>
          <div
            v-if="openPanel === 'link'"
            class="panel-popover right-0 z-[20] mt-2 w-72 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
            @mousedown.prevent
            @click.stop
          >
            <div class="space-y-2.5">
              <div class="panel-header">
                <div class="panel-title">链接</div>
                <button type="button" class="btn btn-ghost btn-xs" @mousedown.prevent @click="unsetLink">移除</button>
              </div>
              <input v-model="linkDraft" class="input input-bordered input-sm w-full" placeholder="https://example.com" @mousedown.stop @click.stop />
              <div class="panel-tip">先选中文本，再应用链接。</div>
              <div class="flex justify-end">
                <button type="button" class="btn btn-sm btn-primary" @mousedown.prevent @click="applyLink">应用链接</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="toolbar-button toolbar-button-icon" title="移除超链接" aria-label="移除超链接" @mousedown.prevent @click="unsetLink">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4.47 4.47a.75.75 0 0 1 1.06 0l10 10a.75.75 0 1 1-1.06 1.06l-1.778-1.777a3.75 3.75 0 0 1-4.121-.865.75.75 0 0 1 1.06-1.06 2.25 2.25 0 0 0 2.135.594L8.62 9.19a2.25 2.25 0 0 0-1.65 3.842.75.75 0 1 1-1.06 1.06A3.75 3.75 0 0 1 7.56 7.73L4.47 4.53a.75.75 0 0 1 0-1.06Zm7.97.34a3.75 3.75 0 0 1 3.649 6.083.75.75 0 0 1-1.061-1.06 2.25 2.25 0 0 0-2.412-3.676l-.177.051a.75.75 0 0 1-.412-1.442l.413-.118Zm-7.264 2.46a.75.75 0 0 1 1.06 0l.764.764a.75.75 0 1 1-1.06 1.06l-.764-.763a.75.75 0 0 1 0-1.061Z" fill="currentColor"/></svg>
        </button>
        <div class="relative">
          <button type="button" class="toolbar-button toolbar-button-icon" :class="openPanel === 'image' ? 'toolbar-button-active' : ''" title="图片链接" aria-label="图片链接" @mousedown.prevent @click.stop="toggleImagePanel">
            <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4.75 4A1.75 1.75 0 0 0 3 5.75v8.5C3 15.216 3.784 16 4.75 16h10.5A1.75 1.75 0 0 0 17 14.25v-8.5A1.75 1.75 0 0 0 15.25 4H4.75Zm0 1.5h10.5a.25.25 0 0 1 .25.25v5.072l-2.117-2.118a1.75 1.75 0 0 0-2.475 0l-2.25 2.25-.617-.617a1.75 1.75 0 0 0-2.475 0L4.5 11.403V5.75a.25.25 0 0 1 .25-.25Zm-.25 7.974 2.126-2.126a.25.25 0 0 1 .354 0l1.147 1.147a.75.75 0 0 0 1.06 0l2.78-2.78a.25.25 0 0 1 .354 0l3.179 3.179v1.356a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25v-.776ZM13.25 7a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" fill="currentColor"/></svg>
          </button>
          <div v-if="openPanel === 'image'" class="panel-popover right-0 z-[20] mt-2 w-72 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl" @mousedown.prevent @click.stop>
            <div class="space-y-2.5">
              <div class="panel-header">
                <div class="panel-title">图片链接</div>
              </div>
              <input v-model="imageDraft" class="input input-bordered input-sm w-full" placeholder="https://example.com/image.jpg" @mousedown.stop @click.stop />
              <div class="panel-tip">输入公开可访问的图片 URL。</div>
              <div class="flex justify-end">
                <button type="button" class="btn btn-sm btn-primary" @mousedown.prevent @click="applyImage">插入图片</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="toolbar-button toolbar-button-icon" title="插入文件" aria-label="插入文件" @mousedown.prevent @click.stop="showFilePicker = true">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13ZM4.5 3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V7.622a.5.5 0 0 0-.146-.354l-4.122-4.121A.5.5 0 0 0 11.379 3H4.5Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" title="分割线" aria-label="分割线" @mousedown.prevent @click="editor?.chain().focus().setHorizontalRule().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Zm5.47-5.28a.75.75 0 0 1 1.06 0l1.75 1.75a.75.75 0 1 1-1.06 1.06L10.75 7.06v5.88l.47-.47a.75.75 0 0 1 1.06 1.06l-1.75 1.75a.75.75 0 0 1-1.06 0l-1.75-1.75a.75.75 0 1 1 1.06-1.06l.47.47V7.06l-.47.47a.75.75 0 1 1-1.06-1.06l1.75-1.75Z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button toolbar-button-icon" :disabled="!editor?.can().chain().focus().undo().run()" title="撤销" aria-label="撤销" @mousedown.prevent @click="editor?.chain().focus().undo().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M8.72 4.72a.75.75 0 0 0-1.06 0L4.41 7.97a.75.75 0 0 0 0 1.06l3.25 3.25a.75.75 0 0 0 1.06-1.06L6.78 9.28H11a4.5 4.5 0 1 1 0 9H7.5a.75.75 0 0 0 0 1.5H11a6 6 0 1 0 0-12H6.78l1.94-1.94a.75.75 0 0 0 0-1.06Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" :disabled="!editor?.can().chain().focus().redo().run()" title="重做" aria-label="重做" @mousedown.prevent @click="editor?.chain().focus().redo().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M11.28 4.72a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 1 1-1.06-1.06l1.94-1.94H9a4.5 4.5 0 0 0 0 9h3.5a.75.75 0 0 1 0 1.5H9a6 6 0 0 1 0-12h4.22l-1.94-1.94a.75.75 0 0 1 0-1.06Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="toolbar-button toolbar-button-icon" title="清除格式" aria-label="清除格式" @mousedown.prevent @click="editor?.chain().focus().clearNodes().unsetAllMarks().run()">
          <svg viewBox="0 0 20 20" class="toolbar-icon" aria-hidden="true"><path d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 1 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 1 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z" fill="currentColor"/></svg>
        </button><button type="button" class="toolbar-button toolbar-button-wide" :class="htmlMode ? 'toolbar-button-active' : ''" title="HTML 源码" @mousedown.prevent @click="toggleHtmlMode">
          <span>HTML</span>
        </button>
      </div>
    </div>

    <div class="bg-base-100 px-5 py-4">
      <textarea v-if="htmlMode" v-model="htmlDraft" class="textarea textarea-bordered w-full font-mono text-sm min-h-48" @input="onHtmlInput" />
      <EditorContent v-else :editor="editor" class="tiptap-editor" />
    </div>
  </div>

  <!-- 文件选择弹窗 -->
  <FilePickerModal
    v-if="showFilePicker"
    :show="showFilePicker"
    @close="showFilePicker = false"
    @select="handleFileSelect"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import FilePickerModal from "../../../components/FilePickerModal.vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const textColors = [
  { value: "#111827" },
  { value: "#2563eb" },
  { value: "#7c3aed" },
  { value: "#dc2626" },
  { value: "#16a34a" },
  { value: "#ea580c" },
] as const;

const highlightColors = [
  { value: "#fef08a" },
  { value: "#bfdbfe" },
  { value: "#fecdd3" },
  { value: "#bbf7d0" },
] as const;

const rootRef = ref<HTMLElement | null>(null);
const openPanel = ref<null | "text" | "highlight" | "link" | "image">(null);
const htmlMode = ref(false);
const htmlDraft = ref("");
const linkDraft = ref("");
const imageDraft = ref("");
const showFilePicker = ref(false);

const editor = useEditor({
  immediatelyRender: false,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
    TextStyle,
    Color.configure({
      types: ["textStyle"],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Placeholder.configure({
      placeholder: "请输入商品详情内容",
    }),
  ],
  content: "",
  editorProps: {
    attributes: {
      class: "prose max-w-none min-h-48 focus:outline-none",
    },
    handleClick(_view, _pos, event) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("a")) {
        event.preventDefault();
        return true;
      }

      return false;
    },
  },
  onUpdate({ editor: currentEditor }) {
    emit("update:modelValue", currentEditor.getHTML());
  },
});

const isTextColorActive = computed(() => textColors.some((color) => isTextColorSelected(color.value)));

watch(
  [() => editor.value, () => props.modelValue],
  (value) => {
    const instance = editor.value;
    const nextValue = Array.isArray(value) ? value[1] : props.modelValue;

    if (!instance) {
      return;
    }

    const currentHtml = instance.getHTML();
    if ((nextValue || "") === currentHtml) {
      return;
    }

    instance.commands.setContent(nextValue || "", false);
  },
  { immediate: true },
);

function toggleHtmlMode() {
  if (!htmlMode.value) {
    htmlDraft.value = editor.value?.getHTML() ?? "";
  } else {
    editor.value?.commands.setContent(htmlDraft.value, false);
    emit("update:modelValue", htmlDraft.value);
  }
  htmlMode.value = !htmlMode.value;
}

function onHtmlInput() {
  emit("update:modelValue", htmlDraft.value);
}

function toggleHeading(level: 2 | 3) {
  editor.value?.chain().focus().toggleHeading({ level }).run();
}

function isTextColorSelected(color: string) {
  const activeColor = normalizeColor(editor.value?.getAttributes("textStyle").color);
  return activeColor !== null && activeColor === normalizeColor(color);
}

function setTextColor(color: string) {
  editor.value?.chain().focus().setColor(color).run();
  openPanel.value = null;
}

function unsetTextColor() {
  editor.value?.chain().focus().unsetColor().run();
  openPanel.value = null;
}

function setHighlightColor(color: string) {
  editor.value?.chain().focus().toggleHighlight({ color }).run();
  openPanel.value = null;
}

function unsetHighlightColor() {
  editor.value?.chain().focus().unsetHighlight().run();
  openPanel.value = null;
}

function syncLinkDraft() {
  linkDraft.value = editor.value?.getAttributes("link").href || "";
}

function applyLink() {
  if (!editor.value) {
    return;
  }

  const trimmed = linkDraft.value.trim();
  if (!trimmed) {
    editor.value.chain().focus().unsetLink().run();
    openPanel.value = null;
    return;
  }

  editor.value.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  openPanel.value = null;
}

function unsetLink() {
  linkDraft.value = "";
  editor.value?.chain().focus().unsetLink().run();
  openPanel.value = null;
}

function applyImage() {
  if (!editor.value) {
    return;
  }

  const src = imageDraft.value.trim();
  if (!src) {
    return;
  }

  editor.value.chain().focus().setImage({ src }).run();
  imageDraft.value = "";
  openPanel.value = null;
}

function handleFileSelect(url: string) {
  if (!editor.value) {
    return;
  }
  editor.value.chain().focus().setImage({ src: url }).run();
  showFilePicker.value = false;
}

function togglePanel(panel: "text" | "highlight") {
  openPanel.value = openPanel.value === panel ? null : panel;
}

function toggleLinkPanel() {
  syncLinkDraft();
  openPanel.value = openPanel.value === "link" ? null : "link";
}

function toggleImagePanel() {
  openPanel.value = openPanel.value === "image" ? null : "image";
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (!rootRef.value?.contains(target)) {
    openPanel.value = null;
  }
}

function normalizeColor(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("#")) {
    return normalized;
  }

  const rgbMatch = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbMatch) {
    return normalized;
  }

  const [, r, g, b] = rgbMatch;
  return `#${[r, g, b]
    .map((component) => Number(component).toString(16).padStart(2, "0"))
    .join("")}`;
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  editor.value?.destroy();
});
</script>

<style scoped>
:deep(.editor-shell) {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.editor-shell:focus-within) {
  border-color: color-mix(in srgb, var(--color-primary, #3b82f6) 45%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary, #3b82f6) 14%, transparent);
}

:deep(.toolbar-group) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

:deep(.toolbar-divider) {
  width: 1px;
  align-self: stretch;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

:deep(.panel-popover) {
  position: absolute;
  top: 100%;
}

:deep(.toolbar-spacer) {
  flex: 1 1 auto;
}

:deep(.toolbar-button) {
  min-width: 2.25rem;
  height: 2.25rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  padding: 0 0.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

:deep(.toolbar-button:hover:not(:disabled)) {
  background: color-mix(in srgb, currentColor 7%, transparent);
}

:deep(.toolbar-button:disabled) {
  opacity: 0.45;
  cursor: not-allowed;
}

:deep(.toolbar-button-active) {
  border-color: color-mix(in srgb, var(--color-primary, #3b82f6) 18%, transparent);
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 12%, transparent);
  color: var(--color-primary, #3b82f6);
}

:deep(.toolbar-button-wide) {
  min-width: 3.25rem;
}

:deep(.toolbar-button-icon) {
  min-width: 2.4rem;
  padding: 0;
}

:deep(.toolbar-icon) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

:deep(.panel-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

:deep(.panel-title) {
  font-size: 0.82rem;
  font-weight: 700;
  color: color-mix(in srgb, currentColor 78%, transparent);
}

:deep(.panel-grid) {
  display: grid;
  gap: 0.55rem;
}

:deep(.panel-grid-colors) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-items: center;
}

:deep(.panel-tip) {
  font-size: 0.73rem;
  color: color-mix(in srgb, currentColor 58%, transparent);
}

:deep(.color-swatch-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: transparent;
  transition: transform 0.15s ease;
}

:deep(.color-swatch-button:hover) {
  transform: translateY(-1px);
}

:deep(.color-swatch) {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, currentColor 10%, transparent);
  background: var(--swatch-color);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.75);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

:deep(.color-swatch-button:hover .color-swatch) {
  transform: translateY(-1px);
}

:deep(.color-swatch-active) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #3b82f6) 30%, transparent);
}

:deep(.color-swatch-highlight) {
  position: relative;
}

:deep(.color-swatch-highlight::after) {
  content: "";
  position: absolute;
  inset: 0.28rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.32);
}

:deep(.tiptap-editor .ProseMirror) {
  min-height: 12rem;
  padding: 0;
  color: inherit;
}

:deep(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
  color: color-mix(in srgb, currentColor 40%, transparent);
  content: "请输入商品详情内容";
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap-editor .ProseMirror ul),
:deep(.tiptap-editor .ProseMirror ol) {
  padding-left: 1.25rem;
}

:deep(.tiptap-editor .ProseMirror h2) {
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  font-size: 1.4rem;
  font-weight: 700;
}

:deep(.tiptap-editor .ProseMirror h3) {
  margin-top: 1rem;
  margin-bottom: 0.65rem;
  font-size: 1.08rem;
  font-weight: 700;
}

:deep(.tiptap-editor .ProseMirror blockquote) {
  margin: 1rem 0;
  border-left: 3px solid color-mix(in srgb, var(--color-primary, #3b82f6) 40%, transparent);
  padding-left: 0.9rem;
  color: color-mix(in srgb, currentColor 75%, transparent);
}

:deep(.tiptap-editor .ProseMirror hr) {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

:deep(.tiptap-editor .ProseMirror img),
:deep(.tiptap-editor .ProseMirror .editor-image) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1rem auto;
  border-radius: 0.85rem;
}

:deep(.tiptap-editor .ProseMirror a) {
  color: var(--color-primary, #3b82f6);
  text-decoration: underline;
}

:deep(.tiptap-editor .ProseMirror mark) {
  border-radius: 0.3rem;
  padding: 0.08rem 0.18rem;
  color: inherit;
}
</style>
