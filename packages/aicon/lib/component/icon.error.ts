/*
 * @CreateTime: Jan 22, 2019 2:59 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 22, 2019 2:59 PM
 * @Description: aicon常规错误使用报错信息提示
 */

import { outputErr, lxOuputPrefix } from '../utils';

export function NameSpaceIsNotSpecifyError(): Error {
    return new Error(`${lxOuputPrefix}Type should have a namespace. Try "namespace: ${name}".`);
}

export function IconNotFoundError(icon: string): Error {
    return new Error(`${lxOuputPrefix}the icon ${icon} does not exist`);
}

export function HttpModuleNotImport(): null {
    outputErr('you need to import "HttpClientModule" to use dynamic importing');
    return null;
}

export function UrlNotSafeError(url:string): Error {
    return new Error(`${lxOuputPrefix}The url "${url}" is unsafe.`);
}

export function SVGTagNotFoundError(): Error {
    return new Error(`${lxOuputPrefix}<svg> tag not found`);
}