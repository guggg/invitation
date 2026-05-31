# 婚禮邀請函專案修改與交接說明文件 (HANDOVER)

本文件說明近期針對「朋友版邀請函（Friends Experience）」所做的需求修改、實作邏輯，以及後續維護或交接人員如何繼續開發的指南。

---

## 1. 修改內容與實作方法說明

### ① 註解掉 ASCII 婚鞋轉場動畫
* **目的**：在點擊 Intro 「請點擊」按鈕後的 ASCII 轉場過程，不再出現婚鞋（Shoes）的 ASCII Specimen 畫面。
* **修改檔案**：[`src/components/friends/AsciiPortal.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/AsciiPortal.tsx)
* **實作方式**：
  1. 將 `SPECIMEN_SCENES` 陣列中的 `{ name: "shoes", ... }` 註解掉。
  2. **時間線轉場空隙（新增）**：原本各個 Specimen 之間時間完全接壤（例如 rings 在 0.32 結束而 balloons 立即在 0.32 開始），這會導致視覺上像閃了一下。我們在物件之間設計了明確的 **`0.07` 進度單位（約 380 毫秒）的純背景雜訊過渡期**，優化後的時程為：
     * **Rings (戒指)**：`0.10 ~ 0.28`
     * *雜訊轉場空隙*：`0.28 ~ 0.35`
     * **Balloons (氣球)**：`0.35 ~ 0.53`
     * *雜訊轉場空隙*：`0.53 ~ 0.60`
     * **Bouquet (花束)**：`0.60 ~ 0.78`
     如此一來，前一個物件會先優雅地完全淡出，並呈現約 0.38 秒的矩陣數位雜訊律動，下一個物件再平滑地掃描淡入，使轉場體驗極其流暢、舒適且具有儀式感。
  3. **氣球顯示時間優化**：我們將 `renderBalloonSpecimen` 的 Reveal 起點同步改為新時程的 `0.35`，使其在進入 Balloons 時刻後立刻完整顯示，不再有短暫消失的現象。
  4. 同步修改了單元測試 [`src/test/ascii-portal.test.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/test/ascii-portal.test.tsx) 中對轉場進度對應場景名稱及透明度檢測的斷言，確保 `npm run test` 可以完全通過。

### ② Intro 頁面鎖定捲動（防提前滑動）
* **目的**：在使用者尚未點擊「請點擊」進入網站前，禁止頁面上下滾動。防止滑動到下方的區塊，導致點擊後動畫跑完時畫面沒有停在最上方的 Hero 區塊。
* **修改檔案**：
  * [`src/components/friends/AsciiPortal.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/AsciiPortal.tsx)
  * [`src/components/friends/FriendsMotionController.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/FriendsMotionController.tsx)
* **實作方式**：
  1. **原生滾動鎖定**：在 `AsciiPortal.tsx` 的 `useEffect` 中，只要 Intro 的 `phase !== "done"`，就將 `document.body.style.overflow` 及 `document.documentElement.style.overflow` 設為 `"hidden"`，在 Intro 結束時還原為 `""`。
  2. **Lenis 滾動庫鎖定**：為了與 `FriendsMotionController` 中初始化的 Lenis 滾動庫協調，我們在 `AsciiPortal` 中對 `window` 發送了自訂事件 `"portal-phase-change"`，並攜帶目前的階段狀態。
  3. `FriendsMotionController` 監聽此事件後，若偵測到 Intro 尚未完成，便呼叫 `lenis.stop()` 停止偵聽任何滾動事件；直到階段變為 `"done"`，再呼叫 `lenis.start()` 解鎖滾動。

### ③ 朋友版文字顏色調整（收歸全域變數）
* **目的**：將朋友版幾乎所有的文字（如「Yuan & 4J」、「我們的婚禮邀請」、「邀請你走進我們的婚禮那一天。」、`project-meta` 描述與圖片標籤數字等）都改為純白色，並建立 CSS 變數以利未來修改。
* **修改檔案**：[`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  1. 在 `.friends-v2-shell` 層級定義了 CSS 變數 `--friends-ink: #fff;`。
  2. 將原本朋友版中獨立設置的 `#2f302f`、`#302825`、`.project-gallery` 及 `.project-meta` 所使用的 `#28231f` / `#10131d` 文字顏色，一律替換為 `var(--friends-ink)`。
  3. **例外保留**：第六頁「告訴我們你會不會來」出席表單區域（`.rsvp-theatre`）的字體顏色依然維持原來的深色樣式不變。

### ④ 所有按鈕背景色改為深灰色
* **目的**：依據需求，將畫面中呈現按鈕樣式的所有區塊背景皆改為深灰色。
* **修改檔案**：[`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  * 對以下按鈕與按鈕樣式元素，將背景色調整為 `#2f302f`（深灰/深橄欖色），並搭配 `#ffffff` 白色文字；Hover / Focus 狀態則切換為 `#4a4a4a`（較淡的深灰色）以及輕微的平移或放大動畫：
    1. `.ascii-portal-idle button` (Intro 進入按鈕)
    2. `.venue-copy a` (Google Maps 按鈕)
    3. `.rsvp-intent button` (出席/不出席的大張選項卡按鈕)
    4. `.rsvp-identity button`, `.rsvp-next`, `.rsvp-confirm` (下一步、確認送出的主要動作按鈕)
    5. `.rsvp-stepper button` (加減人數的圓形按鈕)

### ⑤ 修正 Google Maps 地點地圖導航與視覺偏移問題
* **目的**：原本背景地圖 iframe 搜尋的關鍵字為「優聖美地」，在 Google Maps 搜尋時會誤導航至美國加州的「優勝美地國家公園 (Yosemite)」，且沒有紅針標記（Highlight Pin）。同時，由於紅針標記預設置中於 iframe 內，會與左側的大字「優聖美地」文字內容重疊影響閱讀。
* **修改檔案**：
  * [`src/lib/wedding.ts`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/lib/wedding.ts)
  * [`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  1. 將 `mapEmbedUrl` 的搜尋查詢參數修改為 `q=%E5%84%AA%E8%81%96%E7%BE%8E%E5%9C%B0%E9%84%89%E6%9D%91%E6%B8%A1%E5%81%87%E5%88%A5%E5%A2%85` (即「優聖美地鄉村渡假別墅」的 URL 編碼)，並將縮放層級調整至 `z=16`。這樣能精確在度假別墅上放置紅色地標圖示（Pin）。
  2. 為了將地標圖示（Pin）往右移開避免與左側文字重疊，我們修改了地圖 iframe 的寬度與定位，將其設為絕對定位、`width: 140%` 且 `left: 0`，將地圖中心點（Pin 的位置）巧妙地平移至畫面的 70% 處（右側），實現「文字在左、地標在右」的完美視覺版面。

### ⑥ 延長最後的 Title 標題動畫時間
* **目的**：點擊進入後，最終呈現的新郎新娘名字與日期 ASCII 藝術字（Title）停留時間原本非常短暫（僅約 0.6 秒即被關閉），導致感受急促。
* **修改檔案**：
  * [`src/components/friends/AsciiPortal.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/AsciiPortal.tsx)
  * [`src/test/ascii-portal.test.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/test/ascii-portal.test.tsx)
* **實作方式**：
  1. 將 `PORTAL_OBJECTS` 中的 `title` 場景啟動進度從原先的 `0.87` 提前至 `0.75`（結束維持 `0.99`），使標題展示的生命週期區間倍增為兩倍長（由 12% 增加至 24% 的進度單元，約為 1.3 秒）。
  2. 這樣在花束（Bouquet）於 `0.78` 漸漸淡出時，標題字體就會在 `0.75` 開始同步浮現（淡入），形成優雅的交叉淡化（Cross-fade）效果，且完整呈現時間也更加充裕。
  3. 同步修改了單元測試中對 `getPortalSceneName` 對應進度階段回傳值的測試斷言，以吻合新的時間線。

### ⑦ 限定點擊「請點擊」按鈕本體才觸發進入
* **目的**：避免使用者在開場頁面隨意點選任意空白處，即誤觸發進入轉場動畫。
* **修改檔案**：
  * [`src/components/friends/AsciiPortal.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/AsciiPortal.tsx)
  * [`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  1. 移除了 `AsciiPortal` 根節點 `div.ascii-portal` 的 `onClick` 點擊監聽器。現在只有點按真正的 `<button>請點擊</button>` 元素時才會觸發網頁進入轉場動畫。
  2. 同時移除了 `.ascii-portal` 的 `cursor: pointer` 樣式。現在除了游標真正懸停在「請點擊」按鈕上會呈現手指形狀（pointer）外，懸停在畫面其他任意空白處皆保持預設游標狀態，以符合「按鈕才可點擊」的視覺指引。

### ⑧ 婚紗相片依長輩與朋友版本進行黑白套裝分流
* **目的**：長輩版只顯示「非黑色套裝」婚紗照，而朋友版則分流包含更多黑色套裝的經典照。
* **修改檔案**：[`src/lib/photos.ts`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/lib/photos.ts)
* **實作方式**：
  1. 對全體婚紗照進行標記與分流：所有帶有黑色套裝的婚紗照（`family-02`, `family-03`, `family-04`, `family-05`, `family-06`, `family-07`, `hero-03`）一律分配至 `role: "gallery"` 或 `role: "hero"`（朋友版呈現）。
  2. 長輩版專用的五張照片（`familyPhotos`）一律替換為非黑色套裝的精選照（包含 `family-01` 及四張原 `gallery-*` 的直幅/橫幅白色系婚紗照）。
  3. 微調了 `photos.ts` 陣列中的宣告順序，使長輩版 Hero 大圖（取 `familyPhotos[2]`）依然對應直幅（Portrait）比例照片，確保版面排版完美無跑版。

### ⑨ 修正 ASCII 轉場畫布右側未填滿（留白）問題
* **目的**：修正開場 ASCII 粒子背景動畫右側會殘留一部分空白邊緣沒有被粒子填滿的問題。
* **修改檔案**：[`src/components/friends/AsciiPortal.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/AsciiPortal.tsx)
* **實作方式**：
  * **字元寬度修正**：瀏覽器渲染 `Courier New` Monospace 字型在 `font-size: 12px` 下的實際字元渲染寬度約為 `7.2px`，但原本的程式碼將 `CHAR_WIDTH` 估計為 `8`。這導致透過寬度除以 `8` 計算出來的總欄數（`cols`）過少，渲染出的 ASCII 畫布寬度小於實際視窗寬度而產生右側空白。我們已將 `CHAR_WIDTH` 修正為精確的 `7.2`，使計算出的網格欄數精確覆蓋整個螢幕寬度，徹底解決右側留白問題。

### ⑩ 新增出席表單「上一頁」功能
* **目的**：允許使用者在填寫朋友版 RSVP 表單的過程中，按「上一頁」返回修改姓名、電話、出席人數或葷素需求，避免填錯時必須重新整理視窗。
* **修改檔案**：
  * [`src/components/friends/FriendRsvpExperience.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/FriendRsvpExperience.tsx)
  * [`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  1. 在 `FriendRsvpExperience.tsx` 中實作 `handleBack` 函數，依據目前的 `step` (步驟狀態) 回推上一個步驟：
     * 步驟 02 (填寫姓名電話) -> 返回步驟 01 (選擇出席狀態)
     * 步驟 03 (統計人數與餐點) -> 返回步驟 02 (填寫姓名電話)
     * 步驟 04 (確認卡片) -> 若選擇會到場，則返回步驟 03 (統計人數與餐點)；若選擇不會到場，則直接返回步驟 02 (填寫姓名電話)。
  2. 新增 `.rsvp-buttons` 排版容器，使用 `flex` 佈局將「上一頁」按鈕（`.rsvp-back`）與主要動作按鈕（下一步、確認內容、送出）並排。
  3. 設計優雅的次要按鈕（`.rsvp-back`）樣式：透明背景、深灰色外框、以及游標懸停時微升與背景加深的互動特效，在視覺上與實色主按鈕形成完美對比。
  4. 當表單提交成功（`status === "success"`）時，隱藏「上一頁」按鈕以防止使用者在提交後返回修改。
  5. 於 [`src/test/friend-rsvp-experience.test.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/test/friend-rsvp-experience.test.tsx) 新增專屬的「上一頁」導覽單元測試，確保前後跳轉時輸入數值不會遺失且邏輯完全正確。

### ⑪ 朋友版 Header 選單毛玻璃漸層淡出背景 (Gradient-Masked Backdrop Blur)
* **目的**：解決當頁面內容往上捲動時，Header 的選單字體會與底下往上滾動的文字或圖片重疊，導致視覺混亂的現象。
* **修改檔案**：[`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  * 使用了極致高級的毛玻璃漸層淡出設計，不使用生硬的底線或色塊，完美重現高階品牌的視覺層次：
    * **無外框、無底線**：移除 Header 直接的背景色與底線，維持 header 內容 100% 清晰。
    * **`::before` 漸層遮罩模糊**：在 `.friends-v2-header::before` 偽元素上設定 `height: 120px` 以及 `backdrop-filter: blur(16px)` 與 `-webkit-backdrop-filter: blur(16px)`，並套用 `background: linear-gradient(to bottom, rgba(247, 246, 242, 0.96) 0%, rgba(247, 246, 242, 0.8) 50%, rgba(247, 246, 242, 0) 100%)`。
    * **`-webkit-mask-image` 遮罩**：使用 `mask-image: linear-gradient(to bottom, black 35%, transparent 100%)`。這使得模糊效果與底色在向下延伸時會柔和且完全地融入網頁中，任何物件捲動穿過 Header 時都會呈現高級的淡出與模糊感。
    * **選單按鈕（Pill Hover）與 Logo 對齊優化**：
      * 給予選單連結 `.friends-v2-header a` 新增 `padding: 6px 14px`，讓滑動 Hover 時的粉色膠囊背景（Pill）擁有更優雅的內縮空間。
      * 為 `.friends-v2-brand` (左側 Logo) 設定獨立的 `padding: 6px 0`，使其完美的與網頁左側對齊線貼合，視覺平衡極佳。

### ⑫ 禁用 Google Maps 背景地圖 pointer-events
* **目的**：解決在手機上以單指滑動瀏覽頁面時，Google Maps iframe 會攔截觸發「兩指移動地圖」的半透明黑色提示框，且該提示文字會與網頁原本的文字重疊的問題。
* **修改檔案**：[`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css)
* **實作方式**：
  * 在 `.venue-map-stage iframe` 加上 `pointer-events: none;`。這能使所有滑動、觸控事件直接「穿透」地圖 iframe，不僅徹底移成了重疊提示文字，更讓手機使用者在經過地圖區塊時能流暢地單指往下滑動，不會被地圖鎖定（使用者若需導航，可直接點擊下方深灰色的「Google Maps」實體按鈕）。

### ⑬ 婚紗照區塊 (Gallery) 新增手機版左右滑動切換
* **目的**：解決手機版因螢幕寬度小於 860px 而未啟用 GSAP 的 ScrollTrigger Pin 滾動解鎖機制，導致使用者往下滑時會「直接略過（Scroll past）」整個婚紗照區塊、無法滑動切換照片的問題。
* **修改檔案**：[`src/components/friends/ProjectGallery.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/ProjectGallery.tsx)
* **實作方式**：
  * 在 `.project-gallery-stage` 容器加上 `onTouchStart` 與 `onTouchEnd` 觸控手勢監聽。
  * 透過計算 `touchStartX` 與觸控結束點的位移，判斷是否為**水平滑動**（`Math.abs(diffX) > Math.abs(diffY)` 且位移大於 `50px`）。
  * 偵測到**左滑**時切換至下一張照片 (`Math.min(projects.length - 1, prev + 1)`)，**右滑**時切換至上一張照片 (`Math.max(0, prev - 1)`)，提供手機使用者直覺且極致順暢的輪播（Carousel）手勢操作體驗，同時不影響原本的上下頁面捲動。

---

## 2. 後續開發與維護指南

### ⚙️ 環境設定
1. **出席回覆 API 連接**：
   本專案使用 Google Sheets 收集 RSVP 出席回覆。表單會將請求傳送至 `NEXT_PUBLIC_RSVP_ENDPOINT`。
   請在專案根目錄確認已建立 `.env.local` 檔案，內容應包含：
   ```env
   NEXT_PUBLIC_RSVP_ENDPOINT=https://script.google.com/macros/s/你的DEPLOYMENT_ID/exec
   ```
   *注意：每次修改 `.env.local` 後，請重新啟動開發伺服器使環境變數生效。*

2. **Google Apps Script 部署設定防雷指標（避免 CORS 與 403 錯誤）**：
   * 當網頁提交表單時，若瀏覽器 Console 出現 `CORS policy: No 'Access-Control-Allow-Origin' header` 以及 `403 (Forbidden)` 錯誤，通常是 **Google Apps Script 的部署權限設定錯誤** 導致 Google 拒絕了匿名請求並重新導向至登入頁面（登入頁面不支援 CORS 因而拋錯）。
   * **解決步驟**：
     1. 開啟該 Google 試算表的 Apps Script 編輯器。
     2. 點按右上角 **「部署」 (Deploy) >「管理部署」 (Manage deployments)** 或 **「新增部署」 (New deployment)**。
     3. 在設定面板中，確保設定如下：
        * **將執行身分 (Execute as)** 設為：**「我」 (Me)**。
        * **具有存取權的使用者 (Who has access)** 設為：**「任何人」 (Anyone)** (注意：不能選為「僅限我自己」或「任何擁有 Google 帳戶的人」)。
     4. 點按 **「部署」** 並進行必要授權，複製產生的網頁應用程式 URL 更新至 `.env.local` 即可。

### 🛠️ 常用指令與驗證流程
在進行任何修改後，建議執行以下指令以確保代碼品質：

* **啟動本地開發伺服器**：
  ```bash
  npm run dev
  ```
* **執行 TypeScript 靜態類型檢查**：
  ```bash
  npm run typecheck
  ```
* **執行單元測試 (Vitest)**：
  ```bash
  npm run test
  ```
* **執行 ESLint 代碼規格檢查**：
  ```bash
  npm run lint
  ```
* **打包正式版本**：
  ```bash
  npm run build
  ```

### 💡 開發常見問答與備忘錄

1. **區網其他裝置（例如手機）連線測試時，點擊按鈕 console 出現 WebSocket 錯誤？**
   * **問題現象**：`WebSocket connection to 'ws://192.168.0.19:3000/_next/webpack-hmr... failed`
   * **說明**：這是 Next.js 開發模式下用來做「熱更新 (Hot Module Replacement)」的 websocket 連線。當使用手機通過區域網路訪問電腦的 localhost 時，手機無法順利建立偵錯 websocket 連線是正常的開發環境現象，**在正式 build 上線（Production 部署）後，因為 HMR 被完全停用，所以這個錯誤絕不會出現在使用者的瀏覽器中**，可以忽略。

2. **想要調整朋友版的文字主色？**
   * 只要修改 [`src/app/globals.css`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/app/globals.css) 中 `.friends-v2-shell` 的 `--friends-ink` 變數即可一鍵調整所有文字顏色。

3. **要怎麼調整滾動平滑度或阻尼？**
   * 請在 [`src/components/friends/FriendsMotionController.tsx`](file:///Users/cfh00585519/Documents/repos/toys/invitation/src/components/friends/FriendsMotionController.tsx) 的 `new Lenis({ lerp: 0.08, wheelMultiplier: 0.85 })` 中微調參數。
