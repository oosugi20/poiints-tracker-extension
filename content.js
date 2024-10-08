(function() {
  const itemsDataEl = document.getElementById('memex-items-data');
  const columnsDataEl = document.getElementById('memex-columns-data');

  const itemsData = JSON.parse(itemsDataEl.textContent);
  console.log('memex-items-dataの内容:', itemsData);

  const columnsData = JSON.parse(columnsDataEl.textContent);
  console.log({ columnsData });

  const pointsId = columnsData.find(data => data.name === 'Points')?.id;
  const groupingColumnId = columnsData.find(data => data.name === '対応月')?.id;
  console.log({groupingColumnId});
  
  // Pointsを抽出して表示
  const itemsValues = itemsData.map(data => data.memexProjectColumnValues);
  console.log({ itemsValues });

  const neededItemsData = itemsValues.map(values => {
    const assigneesCount = values.find(item => item.memexProjectColumnId === 'Assignees')?.value?.length || 0;
    const points = values.find(item => item.memexProjectColumnId === pointsId)?.value?.value || 0;
    const adjustedPoints = assigneesCount * points;
    const groupId = values.find(item => item.memexProjectColumnId === groupingColumnId)?.value?.id;
    return { adjustedPoints, groupId };
  });

  console.log({ neededItemsData });

  const groupData = columnsData.find(data => data.id === groupingColumnId).settings.options;
  console.log({ groupData });

  // rowgroupを取得し、実行
  const rowGroups = document.querySelectorAll('[role="rowgroup"]');
  console.log('rowgroup elements:', rowGroups);

  // project-view::rd:の要素を監視して変更があれば再描画
  const projectViewEl = document.querySelector('[id^="project-view::rd:"]');
  //const tableViewEl = document.querySelector('[data-testid="table-root"]');
  if (projectViewEl) {
    const observer = new MutationObserver(() => {
      // Table Viewでなければ抜ける
      if (!projectViewEl.querySelector('[data-testid="table-root"]')) return;

      console.log('project-view::rd: の変更を検出しました。Adjusted Pointsを再描画します。');
      // FIXME
      // Viewを切り替えた際に、変更は検知できているが、結果が挿入されていない。
      // タイミングの問題な気がするがそうでもなさそう
      // DOMの処理の仕方的に、adjustedTotalPointsElが残ったままになってるけど、
      // なんかが変わってるから表示はされてないみたいなことっぽい？
      // table-rootを見てると、Viewを切り替えた後は犬種自体されない
      update();
    });

    observer.observe(projectViewEl, { childList: true, subtree: true });
  }

  update();

  function update() {
    rowGroups.forEach(rowGroup => {
      renderAdjustedPoints(rowGroup, groupData, neededItemsData);
    });
  }

  function renderAdjustedPoints(rowGroup, groupData, neededItemsData) {
    const groupName = rowGroup.getAttribute('data-testid')?.replace('table-group-', '');
    const group = groupData.find(g => g.name === groupName);

    if (!group) return;

    const groupId = group.id;
    const groupItems = neededItemsData.filter(item => item.groupId === groupId);
    const totalAdjustedPoints = groupItems.reduce((sum, item) => sum + item.adjustedPoints, 0);

    const defaultTotalPointsEl = rowGroup.querySelector('[data-testid="column-sum-Points"]');
    if (!defaultTotalPointsEl) return;

    let adjustedTotalPointsEl = defaultTotalPointsEl.nextElementSibling;
    if (!adjustedTotalPointsEl || !adjustedTotalPointsEl.textContent.startsWith('Adjusted Points:')) {
      adjustedTotalPointsEl = defaultTotalPointsEl.cloneNode(true);
      defaultTotalPointsEl.after(adjustedTotalPointsEl);
    }
    adjustedTotalPointsEl.textContent = `Adjusted Points: ${totalAdjustedPoints}`;
  }

})();
