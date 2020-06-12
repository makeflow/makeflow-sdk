import {
  AccessControl,
  PowerApp,
  PowerAppConfig,
  PowerAppPage,
  PowerAppProcedureField,
  PowerCustomCheckableItem as PowerCustomCheckableItemTypes,
  PowerGlance as PowerGlanceTypes,
  PowerItem as PowerItemTypes,
  PowerNode as PowerNodeTypes,
} from '@makeflow/types';
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  Form,
  Icon,
  Input,
  Layout,
  Row,
  notification,
} from 'antd';
import _ from 'lodash';
import React, {FC, useState} from 'react';
import {v4 as uuid} from 'uuid';

import './App.css';

import {
  AppField,
  Config,
  Page,
  PowerCustomCheckableItem,
  PowerGlance,
  PowerItem,
  PowerNode,
  Procedure,
  Setting,
  SettingTabs,
  Start,
  SubFormItem,
  Tag,
} from './components';
import {permissionData} from './permission';

const {Header, Footer, Content} = Layout;
const {Panel} = Collapse;

export const App: FC = () => {
  // TODO (boen): 直接发布的设置
  const [toShowSetting, setToShowSetting] = useState<boolean>(false);

  const [state, setState] = useState<PowerApp.RawDefinition>(
    {} as PowerApp.RawDefinition,
  );

  handleLeave(state);

  function setContributions(
    partContributions: Partial<PowerApp.RawDefinition['contributions']>,
  ): void {
    let contributions: PowerApp.RawDefinition['contributions'] = {
      ...state.contributions,
      ...partContributions,
    };

    setState({...state, contributions});
  }

  function setResources(
    partResources: Partial<PowerApp.RawDefinition['resources']>,
  ): void {
    let resources: PowerApp.RawDefinition['resources'] = {
      ...state.resources,
      ...partResources,
    };

    setState({...state, resources});
  }

  return (
    <Layout className="app">
      <Header className="header">
        Power App 定义工具
        {localStorage.WIP ? (
          <Icon type="setting" onClick={() => setToShowSetting(true)}></Icon>
        ) : (
          undefined
        )}
      </Header>

      <Start onChange={importedDefinition => setState(importedDefinition)} />

      {localStorage.WIP ? (
        <Setting visible={toShowSetting} setVisible={setToShowSetting} />
      ) : (
        undefined
      )}

      <Content>
        <Row>
          <Col
            className="main"
            style={{backgroundColor: '#fff'}}
            xs={24}
            md={{span: 18, offset: 3}}
            xl={{span: 14, offset: 5}}
          >
            <Form layout="horizontal" labelAlign="left">
              <Collapse defaultActiveKey={['basic']}>
                <Panel header="基础信息" key="basic">
                  <Form.Item label="名称 (英文)" required>
                    <Input
                      value={state.name}
                      placeholder="name"
                      onChange={({target: {value}}) =>
                        setState({...state, name: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="版本号" required>
                    <Input
                      value={state.version}
                      placeholder="version"
                      onChange={({target: {value}}) =>
                        setState({...state, version: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="展示名称 (别名)" required>
                    <Input
                      value={state.displayName}
                      placeholder="displayName"
                      onChange={({target: {value}}) =>
                        setState({...state, displayName: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="描述">
                    <Input
                      value={state.description}
                      placeholder="description"
                      onChange={({target: {value}}) =>
                        setState({...state, description: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="官网主页">
                    <Input
                      value={state.homePageURL}
                      placeholder="homePageURL"
                      onChange={({target: {value}}) =>
                        setState({...state, homePageURL: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="服务器地址">
                    <Input
                      value={state.hookBaseURL}
                      placeholder="hookBaseURL"
                      onChange={({target: {value}}) =>
                        setState({...state, hookBaseURL: value})
                      }
                    />
                  </Form.Item>
                  <Form.Item label="所需权限">
                    <Checkbox.Group
                      value={state.permissions}
                      options={permissionData}
                      onChange={values =>
                        setState({
                          ...state,
                          permissions: values as AccessControl.PermissionName[],
                        })
                      }
                    />
                  </Form.Item>
                </Panel>
                <Panel
                  header={`应用配置参数 (${state.configs?.length ?? 0})`}
                  key="configs"
                >
                  <SettingTabs<PowerAppConfig.Definition>
                    primaryKey="name"
                    component={Config}
                    values={state.configs}
                    onChange={configs => setState({...state, configs})}
                  />
                </Panel>
                <Panel
                  header={`自定义字段 (${state.contributions?.procedureFields
                    ?.length ?? 0})`}
                  key="fields"
                >
                  <SettingTabs<PowerAppProcedureField.FieldBaseDefinition>
                    primaryKey="type"
                    component={AppField}
                    values={state.contributions?.procedureFields}
                    onChange={procedureFields =>
                      setContributions({procedureFields})
                    }
                  />
                </Panel>
                <Panel
                  header={`超级流程项 (${state.contributions?.powerItems
                    ?.length ?? 0})`}
                  key="power-item"
                >
                  <SettingTabs<PowerItemTypes.Definition>
                    primaryKey="name"
                    component={PowerItem}
                    values={state.contributions?.powerItems}
                    onChange={powerItems => setContributions({powerItems})}
                  />
                </Panel>
                <Panel
                  header={`超级节点 (${state.contributions?.powerNodes
                    ?.length ?? 0})`}
                  key="power-node"
                >
                  <SettingTabs<PowerNodeTypes.Definition>
                    primaryKey="name"
                    component={PowerNode}
                    values={state.contributions?.powerNodes}
                    onChange={powerNodes => setContributions({powerNodes})}
                  />
                </Panel>
                <Panel
                  header={`超级概览 (${state.contributions?.powerGlances
                    ?.length ?? 0})`}
                  key="power-glance"
                >
                  <SettingTabs<PowerGlanceTypes.Definition>
                    primaryKey="name"
                    component={PowerGlance}
                    values={state.contributions?.powerGlances}
                    onChange={powerGlances => setContributions({powerGlances})}
                  />
                </Panel>
                <Panel
                  header={`超级自定义检查项 (${state.contributions
                    ?.powerCustomCheckableItems?.length ?? 0})`}
                  key="power-custom-checkable-item"
                >
                  <SettingTabs<PowerCustomCheckableItemTypes.Definition>
                    primaryKey="name"
                    component={PowerCustomCheckableItem}
                    values={state.contributions?.powerCustomCheckableItems}
                    onChange={powerCustomCheckableItems =>
                      setContributions({powerCustomCheckableItems})
                    }
                  />
                </Panel>
                <Panel
                  header={`超级页面 (${state.contributions
                    ?.pages?.length ?? 0})`}
                  key="page"
                >
                  <SettingTabs<PowerAppPage.Definition>
                    primaryKey="name"
                    component={Page}
                    values={state.contributions?.pages}
                    onChange={pages =>
                      setContributions({pages})
                    }
                  />
                </Panel>
                <Panel
                  header={`资源包 => 标签(${state?.resources?.tags?.length ??
                    0}) 流程(${state?.resources?.procedures?.length ?? 0})`}
                  key="resources"
                >
                  <SubFormItem label=" 标签">
                    <SettingTabs<PowerApp.DefinitionTagResource>
                      primaryKey="name"
                      component={Tag}
                      values={state.resources?.tags}
                      onChange={tags => setResources({tags})}
                    />
                  </SubFormItem>
                  <SubFormItem label=" 流程">
                    <SettingTabs<PowerApp.DefinitionProcedureResource>
                      primaryKey="name"
                      component={Procedure}
                      values={state.resources?.procedures}
                      onChange={procedures => setResources({procedures})}
                    />
                  </SubFormItem>
                </Panel>
              </Collapse>

              <Form.Item style={{textAlign: 'center', marginTop: 24}}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => exportDefinition(state)}
                >
                  导出定义
                </Button>
                &nbsp;
                <Button size="large" onClick={() => copyToClipBoard(state)}>
                  复制
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Content>
      <Footer>
        © 2020 成都木帆科技有限公司
        <Button
          type="link"
          onClick={() => window.open('https://makeflow.com', '_blank')}
        >
          makeflow
        </Button>
      </Footer>
    </Layout>
  );
};

function handleLeave(definition: PowerApp.RawDefinition): void {
  window.onbeforeunload = () => {
    if (_.isEmpty(definition)) {
      return undefined;
    }

    return 'handled';
  };
}

/**
 * 格式化 definition
 */
function formatDefinition(
  definition: PowerApp.RawDefinition,
): PowerApp.RawDefinition {
  let powerItem = definition.contributions?.powerItems;

  if (powerItem?.length) {
    definition.contributions!.powerItems = powerItem.map(item => {
      let fields = item.fields;

      // 添加 uuid

      if (fields?.length) {
        item.fields = fields.map(({id, ...rest}) => ({
          ...rest,
          id: id ?? uuid(),
        }));
      }

      // 清空未填的 action target

      let actions = item.actions;

      if (actions?.length) {
        item.actions = actions.map(({target, ...rest}) => ({
          ...rest,
          target: target || undefined,
        }));
      }

      return item;
    });
  }

  return definition;
}

function exportDefinition(definition: PowerApp.RawDefinition): void {
  definition = formatDefinition(definition);

  let anchor = document.createElement('a');

  anchor.download = `${definition.displayName}.json`;
  anchor.href = URL.createObjectURL(
    new Blob([JSON.stringify(definition, undefined, 2)], {type: 'text/plain'}),
  );
  anchor.click();

  URL.revokeObjectURL(anchor.href);
}

function copyToClipBoard(definition: PowerApp.RawDefinition): void {
  definition = formatDefinition(definition);

  let textarea = document.createElement('textarea');

  textarea.setAttribute('readonly', 'readonly');
  textarea.value = JSON.stringify(definition, undefined, 2);

  document.body.appendChild(textarea);

  textarea.setSelectionRange(0, textarea.value.length);
  textarea.select();

  if (document.execCommand('copy')) {
    document.execCommand('copy');

    notification.open({
      message: '复制完成',
      description: '已复制到剪贴板',
    });
  } else {
    notification.open({
      message: '复制失败',
      description: '请使用导出',
    });
  }

  document.body.removeChild(textarea);
}
